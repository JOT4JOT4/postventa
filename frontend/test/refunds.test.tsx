import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefundSection } from '../src/refunds/RefundSection';
import { fetchMock, response } from './case-fixtures';

const refund = { id: 8, caseId: 101, purchaseId: 10, customerId: 20,
  amount: '1500.25', status: 'Pendiente', requestedAt: '2026-11-14T12:00:00Z' };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

async function consult(status = 'Aprobado') {
  render(<RefundSection caseId={101} status={status} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Consultar reembolso' }));
  return user;
}

describe('HU-10: registro y consulta de reembolso desde el caso', () => {
  it('registra el monto, muestra antecedentes y mantiene la solicitud en consulta', async () => {
    fetchMock.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(refund));
    const user = await consult();
    await user.type(await screen.findByLabelText('Monto a reembolsar'), '1500,25');
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud de reembolso' }));
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toContain('/postventa/solicitudes/101/reembolsos');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ amount: '1500.25' });
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
    expect(screen.getByText('#20')).toBeInTheDocument();
    expect(screen.queryByLabelText('Monto a reembolsar')).not.toBeInTheDocument();
  });

  it('consulta una solicitud existente incluso si el caso ya está cerrado', async () => {
    fetchMock.mockResolvedValueOnce(response([refund]));
    await consult('Cerrado');
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar solicitud de reembolso' })).not.toBeInTheDocument();
  });

  it.each(['Abierto', 'En revisión', 'Rechazado', 'Cerrado'])('no ofrece registro para estado %s', async status => {
    fetchMock.mockResolvedValueOnce(response([]));
    await consult(status);
    expect(await screen.findByText(/Solo puede solicitarse cuando el caso esté aprobado/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Monto a reembolsar')).not.toBeInTheDocument();
  });

  it.each(['0', '-1', '0.001', '1e3'])('rechaza monto inválido %s sin enviarlo al servidor', async value => {
    fetchMock.mockResolvedValueOnce(response([]));
    const user = await consult();
    await user.type(await screen.findByLabelText('Monto a reembolsar'), value);
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud de reembolso' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ingresa un monto positivo');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('muestra el conflicto de duplicado y permite actualizar la consulta', async () => {
    fetchMock.mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({ message: 'El caso ya tiene una solicitud de reembolso registrada.' }, false))
      .mockResolvedValueOnce(response([refund]));
    const user = await consult();
    await user.type(await screen.findByLabelText('Monto a reembolsar'), '10');
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud de reembolso' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ya tiene una solicitud');
    await user.click(screen.getByRole('button', { name: 'Actualizar reembolso' }));
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
  });

  it('permite reintentar la consulta si la conexión falla', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Fallo ficticio')).mockResolvedValueOnce(response([]));
    const user = await consult();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Consultar reembolso' }));
    expect(await screen.findByLabelText('Monto a reembolsar')).toBeInTheDocument();
  });
});
