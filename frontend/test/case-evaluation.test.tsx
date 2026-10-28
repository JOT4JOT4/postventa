import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseManagement } from '../src/cases/CaseManagement';
import { mockCase, mockHistory, fetchMock, response } from './case-fixtures';

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

describe('HU-05: evaluación en pantalla', () => {
  it('exige motivo antes de enviar un rechazo y lo conserva en la petición', async () => {
    fetchMock.mockResolvedValueOnce(response(mockCase)).mockResolvedValueOnce(response(mockHistory));
    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { name: 'Caso #101' });
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Nuevo estado'), 'Rechazado');
    const reason = screen.getByLabelText('Motivo del rechazo');
    expect(reason).toBeRequired();
    await user.type(reason, '   ');
    // Se fuerza submit para comprobar también la validación del controlador de interfaz.
    const button = screen.getByRole('button', { name: 'Guardar y actualizar' });
    fireEvent.submit(button.closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Debes ingresar el motivo del rechazo.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockResolvedValueOnce(response({ ...mockCase, status: 'Rechazado' }))
      .mockResolvedValueOnce(response([...mockHistory, {
        previousStatus: 'Abierto', newStatus: 'Rechazado', note: 'Antecedentes insuficientes.',
        changedAt: '2026-10-27T12:00:00Z',
      }]));
    await user.clear(reason);
    await user.type(reason, 'Antecedentes insuficientes.');
    await user.click(button);
    expect(await screen.findByText('El caso ha sido actualizado correctamente.')).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({
      status: 'Rechazado', note: 'Antecedentes insuficientes.',
    });
    expect(screen.queryByLabelText('Nuevo estado')).not.toBeInTheDocument();
    expect(screen.getByText('Antecedentes insuficientes.')).toBeInTheDocument();
  });
});
