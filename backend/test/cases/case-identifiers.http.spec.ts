import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';

const endpoints = [
  { method: 'get', suffix: '', handler: 'findById', body: undefined },
  { method: 'get', suffix: '/historial', handler: 'getHistory', body: undefined },
  { method: 'patch', suffix: '/estado', handler: 'updateStatus', body: { status: 'En revisión' } },
  { method: 'post', suffix: '/resolucion', handler: 'resolve', body: { resolution: 'Resultado ficticio.' } },
] as const;

describe.each(endpoints)('Identificadores en $method /solicitudes/:id$suffix', endpoint => {
  let app: INestApplication;
  const service = {
    findById: jest.fn(), getHistory: jest.fn(), updateStatus: jest.fn(), resolve: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [{ provide: CasesService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    for (const handler of Object.values(service)) handler.mockResolvedValue({ id: 1 });
  });
  afterAll(async () => app.close());

  it.each(['0', '-1', '2147483648', '9007199254740992', '1.5', 'abc'])(
    'rechaza %s sin consultar ni escribir en la persistencia', async id => {
      const response = await request(app.getHttpServer())[endpoint.method](
        `/postventa/solicitudes/${id}${endpoint.suffix}`,
      ).send(endpoint.body).expect(400);
      expect(response.body.message).toContain('identificador');
      for (const handler of Object.values(service)) expect(handler).not.toHaveBeenCalled();
    },
  );

  it.each(['1', '2147483647'])('acepta el identificador válido %s como número', async id => {
    await request(app.getHttpServer())[endpoint.method](
      `/postventa/solicitudes/${id}${endpoint.suffix}`,
    ).send(endpoint.body).expect(endpoint.method === 'post' ? 201 : 200);
    expect(service[endpoint.handler].mock.calls[0][0]).toBe(Number(id));
  });
});
