import {
  BadRequestException, ConflictException, HttpException, Injectable,
  NotFoundException, Optional, ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RequestEntity } from '../requests/request.entity';
import { RequestRegistrationEntity } from '../requests/request-registration.entity';
import { assertReturnAllowedForType } from '../cases/case-actions';
import { CaseStatus } from '../cases/case.types';
import { CreateReturnDto } from './create-return.dto';
import { DatabaseInventoryReturnGateway, InventoryReturnGateway } from './inventory-return.gateway';
import { ReturnEntity } from './return.entity';
import { readReturnProducts, readReturns } from './return-reader';

@Injectable()
export class ReturnsService {
  private readonly inventory: InventoryReturnGateway;

  constructor(
    private readonly db: DataSource,
    @Optional() inventory?: InventoryReturnGateway,
  ) {
    this.inventory = inventory ?? new DatabaseInventoryReturnGateway(db);
  }

  private async operation<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); }
    catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('No fue posible acceder a las devoluciones. Inténtalo nuevamente más tarde.');
    }
  }

  findForCase(caseId: number) {
    return this.operation(async () => {
      if (!await this.db.manager.exists(RequestEntity, { where: { id: caseId } })) {
        throw new NotFoundException('El caso indicado no existe.');
      }
      const [returns, products, warehouse] = await Promise.all([
        readReturns(this.db.manager, caseId),
        readReturnProducts(this.db.manager, caseId),
        this.inventory.findReturnWarehouse(this.db.manager),
      ]);
      const reception = returns[0]
        ? await this.inventory.findReceptionByReturnId(returns[0].id, this.db.manager)
        : null;
      return { returns, products, warehouse, reception };
    });
  }

  create(caseId: number, input: CreateReturnDto) {
    return this.operation(() => this.db.transaction(async manager => {
      const caseRecord = await manager.findOne(RequestEntity, {
        where: { id: caseId }, lock: { mode: 'pessimistic_write' },
      });
      if (!caseRecord) throw new NotFoundException('El caso indicado no existe.');
      if (caseRecord.status !== CaseStatus.Approved) {
        throw new BadRequestException('Solo se puede registrar una devolución para un caso aprobado.');
      }
      const registration = await manager.findOne(RequestRegistrationEntity, { where: { requestId: caseId } });
      assertReturnAllowedForType(registration?.type ?? null);
      if (await manager.exists(ReturnEntity, { where: { caseId } })) {
        throw new ConflictException('El caso ya tiene una devolución registrada.');
      }
      // Serializa las devoluciones de una misma línea, incluso desde casos distintos.
      await manager.query('SELECT pg_advisory_xact_lock(1794652802, $1)', [input.purchaseItemId]);
      await manager.query('SELECT id_detalle_ped FROM detalle_pedido WHERE id_detalle_ped=$1 FOR SHARE',
        [input.purchaseItemId]);
      const product = (await readReturnProducts(manager, caseId))
        .find(item => item.purchaseItemId === input.purchaseItemId);
      if (!product) throw new BadRequestException('El producto debe pertenecer a la compra y estar asociado al caso.');
      if (input.quantity > product.availableQuantity) {
        throw new BadRequestException('La cantidad supera las unidades compradas aún no devueltas. Actualiza la consulta.');
      }
      await manager.save(ReturnEntity, manager.create(ReturnEntity, {
        caseId, purchaseItemId: product.purchaseItemId, productId: product.productId,
        quantity: input.quantity, returnDate: input.returnDate, reason: input.reason,
      }));
      return (await readReturns(manager, caseId))[0];
    }));
  }
}
