import { ConflictException, INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { RefundsController } from '../../src/refunds/refunds.controller';
import { RefundsService } from '../../src/refunds/refunds.service';

describe('HU-10: contrato HTTP de solicitudes de reembolso', () => {
  let app: INestApplication;
  const service = { create: jest.fn(), findForCase: jest.fn() };
  const path = '/postventa/solicitudes/7/reembolsos';
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [RefundsController], providers: [{ provide: RefundsService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    service.create.mockResolvedValue({ id: 1, caseId: 7, amount: '10.00', status: 'Pendiente' });
    service.findForCase.mockResolvedValue([]);
  });
  afterAll(async () => app.close());

  it.each(['0.01', '1', '1.50', '9999999999999.99'])('acepta un monto decimal exacto: %s', async amount => {
    await request(app.getHttpServer()).post(path).send({ amount }).expect(201);
    expect(service.create).toHaveBeenCalledWith(7, expect.objectContaining({ amount }));
  });

  it('recorta espacios antes de registrar el monto', async () => {
    await request(app.getHttpServer()).post(path).send({ amount: ' 10.00 ' }).expect(201);
    expect(service.create).toHaveBeenCalledWith(7, expect.objectContaining({ amount: '10.00' }));
  });

  it.each(['0', '0.00', '-1', '', ' ', '1.001', '1e3', '1,50', 'NaN', 'Infinity',
    '10000000000000', 10, null, true, ['1']])('rechaza monto inválido %j antes de persistir', async amount => {
    await request(app.getHttpServer()).post(path).send({ amount }).expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it.each([{ status: 'Ejecutado' }, { customerId: 99 }, { purchaseId: 99 }, { caseId: 99 }])(
    'rechaza referencias o estado impuestos por el navegador: %j', async extra => {
      await request(app.getHttpServer()).post(path).send({ amount: '10', ...extra }).expect(400);
      expect(service.create).not.toHaveBeenCalled();
    },
  );

  it.each(['0', '-1', '2147483648', 'abc'])('rechaza el identificador de caso %s', async id => {
    const invalidPath = `/postventa/solicitudes/${id}/reembolsos`;
    await request(app.getHttpServer()).get(invalidPath).expect(400);
    await request(app.getHttpServer()).post(invalidPath).send({ amount: '10' }).expect(400);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.findForCase).not.toHaveBeenCalled();
  });

  it('exige monto y permite consultar un caso sin reembolso', async () => {
    await request(app.getHttpServer()).post(path).send({}).expect(400);
    const response = await request(app.getHttpServer()).get(path).expect(200);
    expect(response.body).toEqual([]);
  });

  it('conserva el 409 cuando el caso ya tiene una solicitud', async () => {
    service.create.mockRejectedValueOnce(new ConflictException('El caso ya tiene un reembolso.'));
    await request(app.getHttpServer()).post(path).send({ amount: '10' }).expect(409);
  });

  it('conserva el 404 de un caso inexistente', async () => {
    service.findForCase.mockRejectedValueOnce(new NotFoundException('El caso no existe.'));
    await request(app.getHttpServer()).get(path).expect(404);
  });
});
