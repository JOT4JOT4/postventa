import { Purchase } from '../../src/requests/request.types';

export const fictionalPurchase: Purchase = {
  id: 10,
  customer: { id: 20, name: 'Cliente ficticio de prueba' },
  items: [
    { id: 30, productId: 40, productName: 'Set ficticio A' },
    { id: 31, productId: 41, productName: 'Set ficticio B' },
  ],
};

export const validInput = {
  purchaseId: 10, purchaseItemIds: [30, 31], type: 'Reclamo', reason: 'Faltan piezas.',
};
