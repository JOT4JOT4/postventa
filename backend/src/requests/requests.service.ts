import {
  BadRequestException, HttpException, Injectable, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CreateRequestDto } from './create-request.dto';
import { RequestItemEntity } from './request-item.entity';
import { RequestEntity } from './request.entity';
import { RequestRegistrationEntity } from './request-registration.entity';
import { INITIAL_STATUS, PurchaseGateway } from './request.types';
import { CaseHistoryEntity } from '../cases/case-history.entity';

@Injectable()
export class RequestsService {
  constructor(
    private readonly purchases: PurchaseGateway,
    private readonly dataSource: DataSource,
  ) {}

  async purchaseContext(id: number, manager?: EntityManager) {
    const purchase = await this.purchases.findById(id, manager);
    if (!purchase) throw new NotFoundException('La compra indicada no existe.');
    return purchase;
  }

  async create(input: CreateRequestDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const purchase = await this.purchaseContext(input.purchaseId, manager);
        if (input.purchaseItemIds.some((id) => !purchase.items.some((item) => item.id === id))) {
          throw new BadRequestException('Los productos seleccionados no pertenecen a la compra.');
        }
        const request = await manager.save(RequestEntity, manager.create(RequestEntity, {
          purchaseId: purchase.id,
          customerId: purchase.customer.id,
          reason: input.reason,
          status: INITIAL_STATUS,
        }));
        const registration = await manager.save(RequestRegistrationEntity,
          manager.create(RequestRegistrationEntity, { requestId: request.id, type: input.type }));
        await manager.save(CaseHistoryEntity, manager.create(CaseHistoryEntity, {
          caseId: request.id, previousStatus: null, newStatus: INITIAL_STATUS,
          note: 'Registro inicial de solicitud', changedAt: new Date(),
        }));
        await manager.save(RequestItemEntity, input.purchaseItemIds.map((purchaseItemId) =>
          manager.create(RequestItemEntity, { requestId: request.id, purchaseItemId }),
        ));
        return { ...request, type: registration.type, createdAt: registration.createdAt,
          purchaseItemIds: input.purchaseItemIds };
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'No fue posible guardar la solicitud. Inténtalo nuevamente más tarde.',
      );
    }
  }
}
