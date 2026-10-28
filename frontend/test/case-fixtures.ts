import { vi } from 'vitest';
import { CaseDetail, CaseHistoryEntry } from '../src/cases/case-api';

export const mockCase: CaseDetail = {
  id: 101,
  purchaseId: 10,
  customerId: 20,
  reason: 'Faltan piezas en la caja.',
  description: 'El cliente reportó que falta el cable de alimentación.',
  status: 'Abierto',
  type: 'Reclamo',
  createdAt: '2026-10-25T10:00:00Z',
  items: [30],
  resolution: null,
};

export const mockHistory: CaseHistoryEntry[] = [
  {
    previousStatus: null,
    newStatus: 'Abierto',
    note: 'Registro inicial de solicitud',
    changedAt: '2026-10-25T10:00:00Z',
  },
];

export const fetchMock = vi.fn();
export const response = (body: unknown, ok = true) => ({
  ok,
  json: async () => body,
});

