import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Purchase, PurchaseGateway } from './request.types';

@Injectable()
export class PendingPurchaseGateway extends PurchaseGateway {
  async findById(_id: number): Promise<Purchase | null> {
    void _id;
    throw new ServiceUnavailableException(
      'La conexión con Ventas está pendiente. No es posible verificar la compra ni registrar la solicitud todavía.',
    );
  }
}
