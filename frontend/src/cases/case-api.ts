export const CASE_STATUSES = ['Abierto', 'En revisión', 'Aprobado', 'Rechazado', 'Cerrado'] as const;
export type CaseStatusValue = typeof CASE_STATUSES[number];

export const STATUS_TRANSITIONS: Partial<Record<CaseStatusValue, CaseStatusValue[]>> = {
  'Abierto': ['En revisión', 'Rechazado'],
  'En revisión': ['Aprobado', 'Rechazado', 'Cerrado'],
  'Aprobado': ['Cerrado'],
};

export interface CaseResolution {
  text: string;
  resolvedAt: string;
}

export interface CaseDetail {
  id: number;
  purchaseId: number;
  customerId: number;
  reason: string;
  description: string | null;
  status: CaseStatusValue;
  type: string | null;
  createdAt: string | null;
  items: number[];
  resolution: CaseResolution | null;
}

export interface CaseHistoryEntry {
  previousStatus: string | null;
  newStatus: string;
  note: string | null;
  changedAt: string;
}

export interface UpdateStatusInput {
  status: CaseStatusValue;
  description?: string;
  reason?: string;
  note?: string;
}

export interface ResolveInput {
  resolution: string;
}

const apiUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
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

export function getCase(id: number) {
  return apiRequest<CaseDetail>(`solicitudes/${id}`);
}

export function updateStatus(id: number, input: UpdateStatusInput) {
  return apiRequest<CaseDetail>(`solicitudes/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function resolveCase(id: number, input: ResolveInput) {
  return apiRequest<{ caseId: number; resolution: string; resolvedAt: string }>(
    `solicitudes/${id}/resolucion`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

export function getCaseHistory(id: number) {
  return apiRequest<CaseHistoryEntry[]>(`solicitudes/${id}/historial`);
}
