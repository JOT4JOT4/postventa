import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseList } from '../src/cases/CaseList';
import { CaseSummary } from '../src/cases/case-api';

const summaries: CaseSummary[] = [
  { id: 102, type: 'Cambio', status: 'En revisión', createdAt: '2026-10-26T10:00:00Z', purchaseId: 11, customerId: 21 },
  { id: 101, type: null, status: 'Abierto', createdAt: null, purchaseId: 10, customerId: 20 },
];

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

const response = (body: unknown, ok = true) => ({ ok, json: async () => body });

describe('HU-12: listado de casos (CaseList)', () => {
  it('muestra identificador, tipo y estado de cada caso obtenido del backend', async () => {
    fetchMock.mockResolvedValueOnce(response(summaries));
    render(<CaseList />);

    expect(screen.getByText('Cargando casos…')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: '2 casos registrados' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/postventa\/solicitudes$/);

    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole('rowheader')).toHaveTextContent('#102');
    expect(within(rows[0]).getByText('Cambio')).toBeInTheDocument();
    expect(within(rows[0]).getByText('En revisión')).toBeInTheDocument();
    expect(within(rows[0]).getByText('#11')).toBeInTheDocument();
    expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent('#101');
    expect(within(rows[1]).getByText('Abierto')).toBeInTheDocument();
  });

  it('no inventa tipo ni fecha cuando la BD no los tiene', async () => {
    fetchMock.mockResolvedValueOnce(response([summaries[1]]));
    render(<CaseList />);

    const table = await screen.findByRole('table', { name: '1 caso registrado' });
    expect(within(table).getByText('Sin tipo registrado')).toBeInTheDocument();
    expect(within(table).getByText('Sin fecha registrada')).toBeInTheDocument();
    expect(within(table).queryByText('Reclamo')).not.toBeInTheDocument();
  });

  it('enlaza al detalle de cada caso', async () => {
    fetchMock.mockResolvedValueOnce(response(summaries));
    render(<CaseList />);

    const link = await screen.findByRole('link', { name: 'Ver detalle del caso #101' });
    expect(link).toHaveAttribute('href', '#/casos/101');
  });

  it('no convierte cada estado del listado en una región viva', async () => {
    fetchMock.mockResolvedValueOnce(response(summaries));
    render(<CaseList />);

    await screen.findByRole('table');
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });

  it('informa cuando no hay casos registrados', async () => {
    fetchMock.mockResolvedValueOnce(response([]));
    render(<CaseList />);

    expect(await screen.findByText('Aún no hay casos registrados.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Registrar una solicitud/ })).toHaveAttribute('href', '#/');
  });

  it('muestra el error del servidor y permite reintentar', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ message: 'No fue posible consultar los casos.' }, false))
      .mockResolvedValueOnce(response(summaries));
    render(<CaseList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible consultar los casos.');

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('informa un fallo de red sin mostrar datos', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<CaseList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
