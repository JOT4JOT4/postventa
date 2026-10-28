import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseManagement } from '../src/cases/CaseManagement';
import { CaseDetail, CaseHistoryEntry } from '../src/cases/case-api';

import { mockCase, mockHistory, fetchMock, response } from './case-fixtures';

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

describe('HU-04: vista de gestión de reclamos (CaseManagement)', () => {
  it('renderiza el detalle general, tipo en solo lectura e historial del caso', async () => {
    fetchMock
      .mockResolvedValueOnce(response(mockCase))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);

    expect(screen.getByText(/Cargando información del caso #101/)).toBeInTheDocument();

    expect(await screen.findByRole('heading', { level: 1, name: 'Caso #101' })).toBeInTheDocument();
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('Reclamo')).toBeInTheDocument();
    expect(screen.getByText('Faltan piezas en la caja.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('El cliente reportó que falta el cable de alimentación.')).toBeInTheDocument();
    expect(screen.getByText(/Detalle compra #30/)).toBeInTheDocument();

    // Historial
    expect(screen.getByText(/Caso registrado: Abierto/)).toBeInTheDocument();
    expect(screen.getByText('Registro inicial de solicitud')).toBeInTheDocument();
  });

  it('permite actualizar el estado y la descripción enviando PATCH', async () => {
    const updatedCase: CaseDetail = {
      ...mockCase,
      status: 'En revisión',
      description: 'Descripción actualizada con número de serie.',
    };
    const updatedHistory: CaseHistoryEntry[] = [
      ...mockHistory,
      {
        previousStatus: 'Abierto',
        newStatus: 'En revisión',
        note: 'Pasa a evaluación técnica.',
        changedAt: '2026-10-26T12:00:00Z',
      },
    ];

    fetchMock
      .mockResolvedValueOnce(response(mockCase)) // getCase
      .mockResolvedValueOnce(response(mockHistory)) // getHistory
      .mockResolvedValueOnce(response(updatedCase)) // updateStatus PATCH
      .mockResolvedValueOnce(response(updatedHistory)); // getHistory reload

    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    const user = userEvent.setup();
    const descTextarea = screen.getByLabelText('Descripción del reclamo');
    await user.clear(descTextarea);
    await user.type(descTextarea, 'Descripción actualizada con número de serie.');

    const statusSelect = screen.getByLabelText('Nuevo estado');
    await user.selectOptions(statusSelect, 'En revisión');

    const noteInput = screen.getByLabelText(/Nota del cambio/);
    await user.type(noteInput, 'Pasa a evaluación técnica.');

    const saveButton = screen.getByRole('button', { name: 'Guardar y actualizar' });
    await user.click(saveButton);

    expect(await screen.findByText('El caso ha sido actualizado correctamente.')).toBeInTheDocument();

    const patchCall = fetchMock.mock.calls.find((call) =>
      call[0].includes('/solicitudes/101/estado'),
    );
    expect(patchCall).toBeDefined();
    expect(patchCall[1].method).toBe('PATCH');
    const sentBody = JSON.parse(patchCall[1].body);
    expect(sentBody).toMatchObject({
      status: 'En revisión',
      description: 'Descripción actualizada con número de serie.',
      note: 'Pasa a evaluación técnica.',
    });
  });


});
