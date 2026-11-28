import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseManagement } from '../src/cases/CaseManagement';
import { getCaseActionsPolicy } from '../src/cases/case-actions';
import { fetchMock, mockCase, mockHistory, response } from './case-fixtures';

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

describe('Mapeo de acciones por tipo de solicitud y estado', () => {
  it('mantiene ocultas devolución y reembolso cuando el caso no está aprobado ni cerrado', () => {
    for (const status of ['Abierto', 'En revisión', 'Rechazado'] as const) {
      for (const type of ['Reclamo', 'Cambio', 'Devolución', 'Reembolso', null]) {
        const policy = getCaseActionsPolicy(status, type);
        expect(policy.showReturn).toBe(false);
        expect(policy.showRefund).toBe(false);
        expect(Boolean(policy.pendingNotice)).toBe(status !== 'Rechazado');
      }
    }
  });

  it('oculta las tarjetas y muestra aviso cuando el caso está Abierto o En revisión', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, status: 'En revisión', type: 'Devolución' }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    expect(screen.getByText(/Al aprobar este caso se habilitará la devolución de producto/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Devolución de producto/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Solicitud de reembolso/ })).not.toBeInTheDocument();
  });

  it('no muestra tarjetas ni aviso de acciones pendientes cuando el caso está Rechazado', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, status: 'Rechazado', type: 'Devolución' }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    expect(screen.queryByText(/Al aprobar este caso/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Devolución de producto/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Solicitud de reembolso/ })).not.toBeInTheDocument();
  });

  it('muestra primero 05 Devolución y luego 06 Reembolso (ambos obligatorios) en tipo Devolución aprobado', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, status: 'Aprobado', type: 'Devolución' }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    const returnHeading = await screen.findByRole('heading', { name: /05.*Devolución de producto/ });
    const refundHeading = screen.getByRole('heading', { name: /06.*Solicitud de reembolso/ });

    expect(returnHeading.compareDocumentPosition(refundHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByText('Obligatorio')).toHaveLength(2);
  });

  it('muestra solo 05 Devolución (obligatorio) y oculta reembolso en tipo Cambio aprobado', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, status: 'Aprobado', type: 'Cambio' }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    expect(await screen.findByRole('heading', { name: /05.*Devolución de producto/ })).toBeInTheDocument();
    expect(screen.getByText('Obligatorio')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Solicitud de reembolso/ })).not.toBeInTheDocument();
  });

  it('muestra solo 05 Reembolso (obligatorio) y oculta devolución en tipo Reembolso aprobado', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, status: 'Aprobado', type: 'Reembolso' }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    expect(await screen.findByRole('heading', { name: /05.*Solicitud de reembolso/ })).toBeInTheDocument();
    expect(screen.getByText('Obligatorio')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Devolución de producto/ })).not.toBeInTheDocument();
  });

  it('muestra 05 Devolución y 06 Reembolso como opcionales en tipo Reclamo aprobado o cerrado', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, status: 'Cerrado', type: 'Reclamo' }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    expect(await screen.findByRole('heading', { name: /05.*Devolución de producto/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /06.*Solicitud de reembolso/ })).toBeInTheDocument();
    expect(screen.getAllByText('Opcional')).toHaveLength(2);
  });
});
