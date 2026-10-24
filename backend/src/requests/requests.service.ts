import {
  BadRequestException, Injectable, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateRequestDto } from './create-request.dto';
import { RequestItemEntity } from './request-item.entity';
import { RequestEntity } from './request.entity';
import { INITIAL_STATUS, PurchaseGateway } from './request.types';

@Injectable()
export class RequestsService {
  constructor(
    private readonly purchases: PurchaseGateway,
    private readonly dataSource: DataSource,
  ) {}

  async purchaseContext(id: number) {
    const purchase = await this.purchases.findById(id);
    if (!purchase) throw new NotFoundException('La compra indicada no existe.');
    return purchase;
  }

  async create(input: CreateRequestDto) {
    const purchase = await this.purchaseContext(input.purchaseId);
    if (input.purchaseItemIds.some((id) => !purchase.items.some((item) => item.id === id))) {
      throw new BadRequestException('Los productos seleccionados no pertenecen a la compra.');
    }
    try {
      return await this.dataSource.transaction(async (manager) => {
        const request = await manager.save(RequestEntity, manager.create(RequestEntity, {
          purchaseId: purchase.id,
          customerId: purchase.customer.id,
          type: input.type,
          reason: input.reason,
          status: INITIAL_STATUS,
        }));
        await manager.save(RequestItemEntity, input.purchaseItemIds.map((purchaseItemId) =>
          manager.create(RequestItemEntity, { requestId: request.id, purchaseItemId }),
        ));
        return { ...request, purchaseItemIds: input.purchaseItemIds };
      });
    } catch {
      throw new ServiceUnavailableException(
        'No fue posible guardar la solicitud. Inténtalo nuevamente más tarde.',
      );
    }
  }
}
