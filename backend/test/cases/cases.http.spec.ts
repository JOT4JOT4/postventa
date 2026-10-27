import { ConflictException, INestApplication, NotFoundException, ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';
import { CaseStatus } from '../../src/cases/case.types';

const BASE_CASE = {
  id: 1, purchaseId: 10, customerId: 20, reason: 'Faltan piezas.',
  description: null, status: 'Abierto', type: 'Reclamo',
  createdAt: new Date().toISOString(), items: [30, 31], resolution: null,
};

describe('HU-04: contrato HTTP de gestión de reclamos', () => {
  let app: INestApplication;
  const service = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    resolve: jest.fn(),
    getHistory: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [
        { provide: CasesService, useValue: service },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  // ── GET /:id ────────────────────────────────────────────────
  it('devuelve el detalle completo del caso', async () => {
    service.findById.mockResolvedValue(BASE_CASE);
    const res = await request(app.getHttpServer()).get('/postventa/solicitudes/1').expect(200);
    expect(res.body).toMatchObject({ id: 1, status: 'Abierto', type: 'Reclamo' });
  });

  it('devuelve 404 cuando el caso no existe', async () => {
    service.findById.mockRejectedValue(new NotFoundException('El caso indicado no existe.'));
    await request(app.getHttpServer()).get('/postventa/solicitudes/999').expect(404);
  });

  it('rechaza un identificador no entero', async () => {
    await request(app.getHttpServer()).get('/postventa/solicitudes/abc').expect(400);
    expect(service.findById).not.toHaveBeenCalled();
  });

  // ── PATCH /:id/estado ───────────────────────────────────────
  it('actualiza el estado correctamente', async () => {
    const updated = { ...BASE_CASE, status: 'En revisión' };
    service.updateStatus.mockResolvedValue(updated);
    const res = await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .send({ status: 'En revisión', note: 'Iniciando revisión.' })
      .expect(200);
    expect(res.body.status).toBe('En revisión');
  });

  it('permite actualizar la descripción sin cambiar el estado', async () => {
    service.updateStatus.mockResolvedValue({ ...BASE_CASE, description: 'Producto dañado.' });
    const res = await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .send({ status: 'Abierto', description: 'Producto dañado.' })
      .expect(200);
    expect(res.body.description).toBe('Producto dañado.');
  });

  it.each([
    { status: 'EstadoInválido' },
    { status: null },
    {},
    { status: 'Abierto', description: 'x'.repeat(4001) },
    { status: 'Abierto', note: 'x'.repeat(2001) },
  ])('rechaza entrada inválida %j', async (body) => {
    await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .send(body)
      .expect(400);
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('rechaza una transición no permitida', async () => {
    service.updateStatus.mockRejectedValue(
      new Error('No se puede cambiar de "Abierto" a "Cerrado".'),
    );
    await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .send({ status: 'Cerrado' })
      .expect(500);
  });

  it('responde 503 si la BD no está disponible al actualizar estado', async () => {
    service.updateStatus.mockRejectedValue(
      new ServiceUnavailableException('No fue posible actualizar el caso.'),
    );
    const res = await request(app.getHttpServer())
      .patch('/postventa/solicitudes/1/estado')
      .send({ status: CaseStatus.InReview })
      .expect(503);
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  // ── POST /:id/resolucion ────────────────────────────────────
  it('registra la resolución del caso', async () => {
    service.resolve.mockResolvedValue({ caseId: 1, resolution: 'Se reemplazó el producto.', resolvedAt: new Date().toISOString() });
    const res = await request(app.getHttpServer())
      .post('/postventa/solicitudes/1/resolucion')
      .send({ resolution: 'Se reemplazó el producto.' })
      .expect(201);
    expect(res.body.resolution).toBe('Se reemplazó el producto.');
  });

  it('rechaza texto vacío de resolución', async () => {
    await request(app.getHttpServer())
      .post('/postventa/solicitudes/1/resolucion')
      .send({ resolution: '   ' })
      .expect(400);
    expect(service.resolve).not.toHaveBeenCalled();
  });

  it('devuelve 409 si el caso ya tiene resolución', async () => {
    service.resolve.mockRejectedValue(new ConflictException('El caso ya tiene una resolución registrada.'));
    const res = await request(app.getHttpServer())
      .post('/postventa/solicitudes/1/resolucion')
      .send({ resolution: 'Segunda resolución.' })
      .expect(409);
    expect(res.body.message).toContain('resolución registrada');
  });

  it('devuelve 404 al resolver un caso inexistente', async () => {
    service.resolve.mockRejectedValue(new NotFoundException('El caso indicado no existe.'));
    await request(app.getHttpServer())
      .post('/postventa/solicitudes/999/resolucion')
      .send({ resolution: 'Resolución ficticia.' })
      .expect(404);
  });

  // ── GET /:id/historial ──────────────────────────────────────
  it('devuelve el historial del caso', async () => {
    const history = [{ previousStatus: null, newStatus: 'Abierto', note: null, changedAt: new Date().toISOString() }];
    service.getHistory.mockResolvedValue(history);
    const res = await request(app.getHttpServer()).get('/postventa/solicitudes/1/historial').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].newStatus).toBe('Abierto');
  });

  it('devuelve 404 para el historial de un caso inexistente', async () => {
    service.getHistory.mockRejectedValue(new NotFoundException('El caso indicado no existe.'));
    await request(app.getHttpServer()).get('/postventa/solicitudes/999/historial').expect(404);
  });
});
