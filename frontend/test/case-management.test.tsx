import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseManagement } from '../src/cases/CaseManagement';
import { CaseDetail, CaseHistoryEntry } from '../src/cases/case-api';

const mockCase: CaseDetail = {
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

const mockHistory: CaseHistoryEntry[] = [
  {
    previousStatus: null,
    newStatus: 'Abierto',
    note: 'Registro inicial de solicitud',
    changedAt: '2026-10-25T10:00:00Z',
  },
];

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

const response = (body: unknown, ok = true) => ({
  ok,
  json: async () => body,
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
