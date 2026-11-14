import { ConflictException, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ReturnsController } from '../../src/returns/returns.controller';
import { ReturnsService } from '../../src/returns/returns.service';

describe('HU-06: validación y contrato HTTP de devoluciones', () => {
  let app: INestApplication;
  const service = { create: jest.fn(), findForCase: jest.fn() };
  const path = '/postventa/solicitudes/7/devoluciones';
  const input = { purchaseItemId: 30, quantity: 2, returnDate: '2026-11-14', reason: 'Piezas faltantes' };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReturnsController], providers: [{ provide: ReturnsService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    service.create.mockResolvedValue({ id: 1, caseId: 7, ...input });
    service.findForCase.mockResolvedValue({ returns: [], products: [] });
  });
  afterAll(async () => app.close());

  it('registra los datos exigidos y recorta el motivo', async () => {
    await request(app.getHttpServer()).post(path).send({ ...input, reason: ' Piezas faltantes ' }).expect(201);
    expect(service.create).toHaveBeenCalledWith(7, expect.objectContaining(input));
  });

  it.each([0, -1, 1.5, '2', true, null, [], 2147483648])('rechaza cantidad inválida %j', async quantity => {
    await request(app.getHttpServer()).post(path).send({ ...input, quantity }).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5, '30', null, 2147483648])('rechaza línea inválida %j', async purchaseItemId => {
    await request(app.getHttpServer()).post(path).send({ ...input, purchaseItemId }).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it.each(['2026-02-29', '2026-04-31', '0000-01-01', '2026-13-01', '14-11-2026',
    '2026-11-14T12:00:00Z', '', null])('rechaza fecha inválida %j', async returnDate => {
    await request(app.getHttpServer()).post(path).send({ ...input, returnDate }).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it.each(['2024-02-29', '2026-01-01'])('acepta fecha calendario válida %s', async returnDate => {
    await request(app.getHttpServer()).post(path).send({ ...input, returnDate }).expect(201);
  });

  it.each(['', '  ', 'a'.repeat(2001), null, 123])('rechaza motivo inválido %#', async reason => {
    await request(app.getHttpServer()).post(path).send({ ...input, reason }).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it.each(['purchaseItemId', 'quantity', 'returnDate', 'reason'])('exige el campo %s', async key => {
    const missing: Record<string, unknown> = { ...input };
    delete missing[key];
    await request(app.getHttpServer()).post(path).send(missing).expect(400);
  });

  it.each([{ productId: 99 }, { customerId: 99 }, { purchaseId: 99 }, { caseId: 99 }, { status: 'Recibida' }])(
    'rechaza referencias o estados impuestos por el navegador: %j', async extra => {
      await request(app.getHttpServer()).post(path).send({ ...input, ...extra }).expect(400);
      expect(service.create).not.toHaveBeenCalled();
    });

  it.each(['0', '-1', 'abc', '2147483648'])('rechaza identificador de caso %s', async id => {
    const invalidPath = `/postventa/solicitudes/${id}/devoluciones`;
    await request(app.getHttpServer()).get(invalidPath).expect(400);
    await request(app.getHttpServer()).post(invalidPath).send(input).expect(400);
  });

  it('permite consultar sin devolución y conserva los errores del dominio', async () => {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    expect(response.body).toEqual({ returns: [], products: [] });
    service.create.mockRejectedValueOnce(new ConflictException('El caso ya tiene una devolución.'));
    await request(app.getHttpServer()).post(path).send(input).expect(409);
    service.findForCase.mockRejectedValueOnce(new NotFoundException('El caso no existe.'));
    await request(app.getHttpServer()).get(path).expect(404);
  });
});
