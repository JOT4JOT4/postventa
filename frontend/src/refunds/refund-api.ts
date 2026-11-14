export interface Refund {
  id: number;
  caseId: number;
  purchaseId: number;
  customerId: number;
  amount: string;
  status: string;
  requestedAt: string;
}

const apiUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function request<T>(caseId: number, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/postventa/solicitudes/${caseId}/reembolsos`, options);
  } catch {
    throw new Error('No se pudo conectar con el servidor de reembolsos. Inténtalo nuevamente.');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string | string[] };
    throw new Error(Array.isArray(error.message) ? error.message.join(' ') :
      error.message ?? 'No fue posible completar la operación de reembolso.');
  }
  return response.json() as Promise<T>;
}

export function listRefunds(caseId: number) {
  return request<Refund[]>(caseId);
}

export function createRefund(caseId: number, amount: string) {
  return request<Refund>(caseId, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }),
  });
}
