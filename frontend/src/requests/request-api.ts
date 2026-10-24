export const REQUEST_TYPES = ['Reclamo', 'Cambio', 'Devolución', 'Reembolso'] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export interface Purchase {
  id: number;
  customer: { id: number; name: string };
  items: { id: number; productId: number; productName: string }[];
}

export interface RequestInput {
  purchaseId: number;
  purchaseItemIds: number[];
  type: RequestType;
  reason: string;
}

export interface RegisteredRequest extends RequestInput {
  id: number;
  customerId: number;
  status: string;
  createdAt: string;
}

const apiUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/postventa/${path}`, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(body.message) ? body.message.join(' ') :
      body.message ?? 'No fue posible completar la operación.');
  }
  return response.json() as Promise<T>;
}

export function findPurchase(id: number) {
  return request<Purchase>(`compras/${id}`);
}

export function registerRequest(input: RequestInput) {
  return request<RegisteredRequest>('solicitudes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
