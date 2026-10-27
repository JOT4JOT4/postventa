import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { CaseDetail, CaseSummary } from '../src/cases/case-api';

const summaries: CaseSummary[] = [
  { id: 101, type: 'Reclamo', status: 'Abierto', createdAt: '2026-10-25T10:00:00Z', purchaseId: 10, customerId: 20 },
];

const detail = (id: number): CaseDetail => ({
  id, purchaseId: 10, customerId: 20, reason: 'Faltan piezas.', description: null,
  status: 'Abierto', type: 'Reclamo', createdAt: '2026-10-25T10:00:00Z', items: [30], resolution: null,
});

const response = (body: unknown, ok = true) => ({ ok, json: async () => body });

const fetchMock = vi.fn(async (url: string) => {
  const path = new URL(url).pathname;
  if (path === '/postventa/solicitudes') return response(summaries);
  const historyMatch = /^\/postventa\/solicitudes\/(\d+)\/historial$/.exec(path);
  if (historyMatch) return response([]);
  const detailMatch = /^\/postventa\/solicitudes\/(\d+)$/.exec(path);
  if (detailMatch) return response(detail(Number(detailMatch[1])));
  return response({ message: 'Ruta no esperada en la prueba.' }, false);
});

const requestedPaths = () => fetchMock.mock.calls.map(([url]) => new URL(url).pathname);

function openAt(url: string) {
  window.history.replaceState(null, '', url);
  return render(<App />);
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockClear();
});

describe('HU-12: navegación por hash (App)', () => {
  it('mantiene el formulario de registro como página de inicio', () => {
    openAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Registrar solicitud' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar solicitud' })).toHaveAttribute('aria-current', 'page');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ofrece enlaces a ambas secciones', () => {
    openAt('/');
    const nav = screen.getByRole('navigation', { name: 'Secciones de Postventa' });
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Casos' }));
    expect(screen.getByRole('link', { name: 'Casos' })).toHaveAttribute('href', '#/casos');
    expect(screen.getByRole('link', { name: 'Registrar solicitud' })).toHaveAttribute('href', '#/');
  });

  it('muestra el listado en #/casos, abre el detalle y vuelve al listado', async () => {
    openAt('/#/casos');
    expect(await screen.findByRole('heading', { level: 1, name: 'Casos de Postventa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Casos' })).toHaveAttribute('aria-current', 'page');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('link', { name: 'Ver detalle del caso #101' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Caso #101' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/casos/101');
    expect(requestedPaths()).toEqual(expect.arrayContaining([
      '/postventa/solicitudes/101', '/postventa/solicitudes/101/historial',
    ]));

    await user.click(screen.getByRole('button', { name: 'Volver a solicitudes' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Casos de Postventa' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/casos');
  });

  it('abre directamente el detalle desde #/casos/:id', async () => {
    openAt('/#/casos/7');
    expect(await screen.findByRole('heading', { level: 1, name: 'Caso #7' })).toBeInTheDocument();
  });

  it('convierte el enlace anterior ?caseId= en la ruta por hash', async () => {
    openAt('/?caseId=5');
    expect(await screen.findByRole('heading', { level: 1, name: 'Caso #5' })).toBeInTheDocument();
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('#/casos/5');
  });

  it.each(['/#/casos/abc', '/#/casos/0', '/#/casos/2147483648', '/#/otra'])(
    'muestra "Página no encontrada" para %s sin consultar el backend',
    async (url) => {
      openAt(url);
      expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument();
      await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    },
  );
});
