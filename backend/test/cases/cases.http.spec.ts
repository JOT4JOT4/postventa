import { ConflictException, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';

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
