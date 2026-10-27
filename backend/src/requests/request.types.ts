import { EntityManager } from 'typeorm';

export enum RequestType {
  Complaint = 'Reclamo',
  Exchange = 'Cambio',
  Return = 'Devolución',
  Refund = 'Reembolso',
}

export const INITIAL_STATUS = 'Abierto';

export interface Purchase {
  id: number;
  customer: { id: number; name: string };
  items: { id: number; productId: number; productName: string }[];
}

export abstract class PurchaseGateway {
  abstract findById(id: number, manager?: EntityManager): Promise<Purchase | null>;
}
