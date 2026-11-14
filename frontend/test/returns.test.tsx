import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReturnSection } from '../src/returns/ReturnSection';
import { fetchMock, response } from './case-fixtures';

const product = { purchaseItemId: 30, productId: 40, productName: 'Set ficticio A',
  purchasedQuantity: 3, availableQuantity: 3 };
const data = { returns: [], products: [product] };
const record = { id: 8, caseId: 101, purchaseId: 10, customerId: 20, purchaseItemId: 30,
  productId: 40, productName: 'Set ficticio A', quantity: 2, returnDate: '2026-11-14', reason: 'Piezas faltantes' };

beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });

async function consult(status = 'Aprobado') {
  render(<ReturnSection caseId={101} status={status} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Consultar devolución' }));
  return user;
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, quantity = '2') {
  await user.selectOptions(await screen.findByLabelText('Producto a devolver'), '30');
  await user.type(screen.getByLabelText('Cantidad a devolver'), quantity);
  await user.clear(screen.getByLabelText('Fecha de devolución'));
  await user.type(screen.getByLabelText('Fecha de devolución'), '2026-11-14');
  await user.type(screen.getByLabelText('Motivo de devolución'), ' Piezas faltantes ');
}

describe('HU-06: formulario de registro y consulta de devoluciones', () => {
  it('envía solo línea, cantidad, fecha y motivo; muestra el registro asociado al caso', async () => {
    fetchMock.mockResolvedValueOnce(response(data)).mockResolvedValueOnce(response(record));
    const user = await consult();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Registrar devolución' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Devolución #8 registrada');
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toContain('/postventa/solicitudes/101/devoluciones');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ purchaseItemId: 30, quantity: 2,
      returnDate: '2026-11-14', reason: 'Piezas faltantes' });
    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('14-11-2026')).toBeInTheDocument();
    expect(screen.getByText('Piezas faltantes')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cantidad a devolver')).not.toBeInTheDocument();
  });

  it('consulta la devolución guardada después del cierre', async () => {
    fetchMock.mockResolvedValueOnce(response({ ...data, returns: [record] }));
    await consult('Cerrado');
    expect(await screen.findByRole('status')).toHaveTextContent('Devolución #8 registrada');
    expect(screen.queryByRole('button', { name: 'Registrar devolución' })).not.toBeInTheDocument();
  });

  it.each(['Abierto', 'En revisión', 'Rechazado', 'Cerrado'])('impide el registro en estado %s', async status => {
    fetchMock.mockResolvedValueOnce(response(data));
    await consult(status);
    expect(await screen.findByText(/Solo puede registrarse cuando el caso esté aprobado/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Cantidad a devolver')).not.toBeInTheDocument();
  });

  it.each(['0', '-1', '1.5', '1e2', '2147483648', '4'])('no envía cantidad inválida o excesiva %s', async value => {
    fetchMock.mockResolvedValueOnce(response(data));
    const user = await consult();
    await fillForm(user, value);
    await user.click(screen.getByRole('button', { name: 'Registrar devolución' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cantidad/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rechaza un motivo compuesto de espacios', async () => {
    fetchMock.mockResolvedValueOnce(response(data));
    const user = await consult();
    await fillForm(user);
    await user.clear(screen.getByLabelText('Motivo de devolución'));
    await user.type(screen.getByLabelText('Motivo de devolución'), '   ');
    await user.click(screen.getByRole('button', { name: 'Registrar devolución' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El motivo debe contener');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('informa cuando no quedan unidades de los productos del caso', async () => {
    fetchMock.mockResolvedValueOnce(response({ returns: [], products: [{ ...product, availableQuantity: 0 }] }));
    await consult();
    expect(await screen.findByText(/No hay productos del caso con unidades disponibles/)).toBeInTheDocument();
  });

  it('muestra un conflicto concurrente y permite recuperar la devolución existente', async () => {
    fetchMock.mockResolvedValueOnce(response(data))
      .mockResolvedValueOnce(response({ message: 'El caso ya tiene una devolución registrada.' }, false))
      .mockResolvedValueOnce(response({ ...data, returns: [record] }));
    const user = await consult();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Registrar devolución' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ya tiene una devolución');
    await user.click(screen.getByRole('button', { name: 'Actualizar devolución' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Devolución #8 registrada');
  });

  it('permite reintentar una consulta sin conexión', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Fallo ficticio')).mockResolvedValueOnce(response(data));
    const user = await consult();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar');
    await user.click(screen.getByRole('button', { name: 'Consultar devolución' }));
    expect(await screen.findByLabelText('Producto a devolver')).toBeInTheDocument();
  });
});
