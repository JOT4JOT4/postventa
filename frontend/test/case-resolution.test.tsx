import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseManagement } from '../src/cases/CaseManagement';
import { CaseDetail } from '../src/cases/case-api';

import { mockCase, mockHistory, fetchMock, response } from './case-fixtures';

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

describe('HU-04: cierre y consulta de reclamos', () => {
  it('bloquea transiciones de estado cuando el caso está en estado terminal', async () => {
    const closedCase: CaseDetail = {
      ...mockCase,
      status: 'Cerrado',
    };
    fetchMock
      .mockResolvedValueOnce(response(closedCase))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    expect(screen.getByText(/El caso se encuentra en estado terminal/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nuevo estado')).not.toBeInTheDocument();
  });

  it('permite registrar la resolución final cuando el caso está en estado terminal', async () => {
    const closedCase: CaseDetail = {
      ...mockCase,
      status: 'Cerrado',
      resolution: null,
    };

    fetchMock
      .mockResolvedValueOnce(response(closedCase)) // getCase
      .mockResolvedValueOnce(response(mockHistory)) // getHistory
      .mockResolvedValueOnce(
        response({
          caseId: 101,
          resolution: 'Se contactó al cliente y se entregó el cable faltante.',
          resolvedAt: '2026-10-27T11:00:00Z',
        }),
      ); // resolveCase POST

    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    const user = userEvent.setup();
    const resolutionInput = screen.getByLabelText('Texto de resolución final');
    await user.type(resolutionInput, 'Se contactó al cliente y se entregó el cable faltante.');

    const resolveButton = screen.getByRole('button', { name: 'Registrar resolución final' });
    await user.click(resolveButton);

    expect(
      await screen.findByText('Resolución final registrada exitosamente.'),
    ).toBeInTheDocument();

    const postCall = fetchMock.mock.calls.find((call) =>
      call[0].includes('/solicitudes/101/resolucion'),
    );
    expect(postCall).toBeDefined();
    expect(postCall[1].method).toBe('POST');
    expect(JSON.parse(postCall[1].body)).toEqual({
      resolution: 'Se contactó al cliente y se entregó el cable faltante.',
    });

    // Muestra la resolución registrada y oculta el formulario
    expect(screen.getByText('Resolución registrada')).toBeInTheDocument();
    expect(
      screen.getByText('Se contactó al cliente y se entregó el cable faltante.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar resolución final' })).not.toBeInTheDocument();
  });

  it('muestra aviso de error si el servidor rechaza la consulta', async () => {
    fetchMock.mockResolvedValue(
      response({ message: 'El caso indicado no existe.' }, false),
    );

    render(<CaseManagement caseId={999} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('El caso indicado no existe.');
  });

  it('no inventa un tipo cuando el caso no lo tiene registrado (HU-12)', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ ...mockCase, type: null }))
      .mockResolvedValueOnce(response(mockHistory));

    render(<CaseManagement caseId={101} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    expect(screen.getByText('Sin tipo registrado')).toBeInTheDocument();
    expect(screen.queryByText('Reclamo')).not.toBeInTheDocument();
  });

  it('ejecuta onBack al presionar el botón de volver', async () => {
    fetchMock
      .mockResolvedValueOnce(response(mockCase))
      .mockResolvedValueOnce(response(mockHistory));

    const onBack = vi.fn();
    render(<CaseManagement caseId={101} onBack={onBack} />);
    await screen.findByRole('heading', { level: 1, name: 'Caso #101' });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Volver a solicitudes' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
