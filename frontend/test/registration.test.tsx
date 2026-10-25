import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from '../src/requests/RegistrationForm';

const purchase = {
  id: 10, customer: { id: 20, name: 'Cliente ficticio de prueba' },
  items: [{ id: 30, productId: 40, productName: 'Set ficticio A' }],
};
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
const response = (body: unknown, ok = true) => ({ ok, json: async () => body });

async function loadPurchase() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Identificador de venta'), '10');
  await user.click(screen.getByRole('button', { name: 'Cargar compra' }));
  await screen.findByText('Cliente ficticio de prueba');
  return user;
}

describe('HU-01: formulario de registro', () => {
  it('impide registrar sin una compra verificada', () => {
    render(<RegistrationForm />);
    expect(screen.getByRole('button', { name: 'Registrar solicitud' })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('informa que los datos compartidos no están disponibles sin inventar una compra', async () => {
    fetchMock.mockResolvedValue(response({ message: 'Los datos compartidos del ERP no están disponibles.' }, false));
    render(<RegistrationForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Identificador de venta'), '10');
    await user.click(screen.getByRole('button', { name: 'Cargar compra' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no están disponibles');
    expect(screen.getByRole('button', { name: 'Registrar solicitud' })).toBeDisabled();
  });

  it('registra compra, productos, tipo y motivo y muestra el identificador y estado', async () => {
    fetchMock.mockResolvedValueOnce(response(purchase)).mockResolvedValueOnce(response({
      id: 101, purchaseId: 10, customerId: 20, status: 'Abierto',
    }));
    render(<RegistrationForm />);
    const user = await loadPurchase();
    await user.click(screen.getByRole('checkbox', { name: /Set ficticio A/ }));
    await user.click(screen.getByRole('radio', { name: 'Reclamo' }));
    await user.type(screen.getByLabelText('Motivo de la solicitud'), '  Faltan piezas.  ');
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Solicitud registrada: 101');
    expect(screen.getByRole('status')).toHaveTextContent('Abierto');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      purchaseId: 10, purchaseItemIds: [30], type: 'Reclamo', reason: 'Faltan piezas.',
    });
    expect(screen.getByRole('button', { name: 'Solicitud registrada' })).toBeDisabled();
  });

  it('exige al menos un producto y no envía un POST incompleto', async () => {
    fetchMock.mockResolvedValueOnce(response(purchase));
    render(<RegistrationForm />);
    const user = await loadPurchase();
    await user.click(screen.getByRole('radio', { name: 'Cambio' }));
    await user.type(screen.getByLabelText('Motivo de la solicitud'), 'Motivo ficticio');
    await user.click(screen.getByRole('button', { name: 'Registrar solicitud' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('al menos un producto');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('invalida el cliente y los productos al cambiar la compra', async () => {
    fetchMock.mockResolvedValueOnce(response(purchase));
    render(<RegistrationForm />);
    const user = await loadPurchase();
    await user.clear(screen.getByLabelText('Identificador de venta'));
    expect(screen.queryByText('Cliente ficticio de prueba')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar solicitud' })).toBeDisabled();
  });

  it('informa un fallo de red', async () => {
    fetchMock.mockRejectedValue(new TypeError('fallo de red'));
    render(<RegistrationForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Identificador de venta'), '10');
    await user.click(screen.getByRole('button', { name: 'Cargar compra' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo conectar'));
  });
});
