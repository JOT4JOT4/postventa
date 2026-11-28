export interface ProductReturn {
  id: number; caseId: number; purchaseId: number; customerId: number;
  purchaseItemId: number; productId: number; productName: string;
  quantity: number; returnDate: string; reason: string;
}

export interface ReturnProduct {
  purchaseItemId: number; productId: number; productName: string;
  purchasedQuantity: number; availableQuantity: number;
}

export type ReceptionStatus = 'Pendiente de recepción' | 'Recibida apta' | 'Recibida con daño';

export interface ReturnWarehouse {
  id: number;
  name: string;
  address: string;
}

export interface InventoryReturnMovement {
  operationType: string;
  recordedAt: string;
  warehouseId: number;
  warehouseName: string | null;
  quantity: number;
}

export interface ReturnReception {
  status: ReceptionStatus;
  warehouseId: number | null;
  warehouseName: string | null;
  quantity: number | null;
  recordedAt: string | null;
  movements: InventoryReturnMovement[];
}

export interface ReturnInput {
  purchaseItemId: number; quantity: number; returnDate: string; reason: string;
}

export interface ReturnData {
  returns: ProductReturn[];
  products: ReturnProduct[];
  warehouse?: ReturnWarehouse | null;
  reception?: ReturnReception | null;
}

const apiUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function request<T>(caseId: number, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/postventa/solicitudes/${caseId}/devoluciones`, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor de devoluciones. Inténtalo nuevamente.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(error.message) ? error.message.join(' ') :
      error.message ?? 'No fue posible completar la operación de devolución.');
  }
  return response.json() as Promise<T>;
}

export function getReturns(caseId: number) { return request<ReturnData>(caseId); }

export function createReturn(caseId: number, input: ReturnInput) {
  return request<ProductReturn>(caseId, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
}
