import { INestApplication, ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { PurchaseGateway } from '../../src/requests/request.types';
import { RequestsController } from '../../src/requests/requests.controller';
import { RequestsService } from '../../src/requests/requests.service';
import { fictionalPurchase, validInput } from './fixtures';

describe('HU-01: contrato HTTP de registro', () => {
  let app: INestApplication;
  let sequence = 0;
  const gateway = { findById: jest.fn() };
  const manager = {
    create: jest.fn((_entity: unknown, value: unknown) => value),
    query: jest.fn(async (sql: string) => sql.includes('MAX(id_reclamo)')
      ? [{ nextId: ++sequence }]
      : []),
    save: jest.fn(async (_entity: unknown, value: object | object[]) =>
      Array.isArray(value) ? value : { ...value, id: ++sequence, createdAt: new Date() }),
  };
  const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [RequestsService,
        { provide: PurchaseGateway, useValue: gateway },
        { provide: DataSource, useValue: { transaction } }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    gateway.findById.mockResolvedValue(fictionalPurchase);
  });
  afterAll(async () => app.close());

  it('identifica cliente y productos de la compra original', async () => {
    const response = await request(app.getHttpServer()).get('/postventa/compras/10').expect(200);
    expect(response.body).toEqual(fictionalPurchase);
  });

  it.each(['0', '-1', '2147483648', 'abc'])('rechaza el identificador de compra %s', async (id) => {
    const response = await request(app.getHttpServer()).get(`/postventa/compras/${id}`).expect(400);
    expect(response.body.message).toContain('identificador');
    expect(gateway.findById).not.toHaveBeenCalled();
  });

  it.each(['Reclamo', 'Cambio', 'Devolución', 'Reembolso'])('registra tipo %s con estado inicial', async (type) => {
    const response = await request(app.getHttpServer()).post('/postventa/solicitudes')
      .send({ ...validInput, type, reason: '  Faltan piezas.  ' }).expect(201);
    expect(response.body).toMatchObject({
      purchaseId: 10, customerId: 20, purchaseItemIds: [30, 31],
      reason: 'Faltan piezas.', type, status: 'Abierto',
    });
    expect(response.body.id).toBeGreaterThan(0);
    expect(manager.save).toHaveBeenCalledTimes(3);
  });

  it('asigna identificadores diferentes', async () => {
    const first = await request(app.getHttpServer()).post('/postventa/solicitudes').send(validInput).expect(201);
    const second = await request(app.getHttpServer()).post('/postventa/solicitudes').send(validInput).expect(201);
    expect(first.body.id).not.toBe(second.body.id);
  });

  it.each([
    { purchaseId: 0 }, { purchaseId: '10' }, { purchaseId: 1.5 },
    { purchaseItemIds: [] }, { purchaseItemIds: [30, 30] }, { purchaseItemIds: [0] },
    { purchaseItemIds: ['30'] }, { purchaseItemIds: Array.from({ length: 101 }, (_, i) => i + 1) },
    { reason: '   ' }, { reason: 'x'.repeat(2001) }, { reason: null },
    { type: 'Otro' }, { type: null }, { status: 'Aprobado' }, { customerId: 999 },
  ])('rechaza entrada inválida %j sin escribir', async (change) => {
    await request(app.getHttpServer()).post('/postventa/solicitudes')
      .send({ ...validInput, ...change }).expect(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('exige los campos obligatorios', async () => {
    await request(app.getHttpServer()).post('/postventa/solicitudes').send({}).expect(400);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rechaza una compra inexistente', async () => {
    gateway.findById.mockResolvedValue(null);
    await request(app.getHttpServer()).post('/postventa/solicitudes').send(validInput).expect(404);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rechaza un producto ajeno a la compra', async () => {
    await request(app.getHttpServer()).post('/postventa/solicitudes')
      .send({ ...validInput, purchaseItemIds: [999] }).expect(400);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('no permite guardar cuando los datos compartidos no están disponibles', async () => {
    gateway.findById.mockRejectedValue(new ServiceUnavailableException('Datos compartidos no disponibles.'));
    await request(app.getHttpServer()).get('/postventa/compras/10').expect(503);
    const response = await request(app.getHttpServer()).post('/postventa/solicitudes').send(validInput).expect(503);
    expect(response.body.message).toContain('no disponibles');
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('oculta detalles internos al fallar la persistencia', async () => {
    transaction.mockRejectedValueOnce(new Error('detalle privado del motor'));
    const response = await request(app.getHttpServer()).post('/postventa/solicitudes').send(validInput).expect(503);
    expect(JSON.stringify(response.body)).not.toContain('detalle privado');
  });
});
