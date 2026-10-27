import { INestApplication, ServiceUnavailableException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';

const SUMMARIES = [
  { id: 2, type: 'Cambio', status: 'En revisión', createdAt: '2026-10-25T10:00:00.000Z', purchaseId: 11, customerId: 21 },
  { id: 1, type: null, status: 'Abierto', createdAt: null, purchaseId: 10, customerId: 20 },
];

describe('HU-12: contrato HTTP del listado de casos', () => {
  let app: INestApplication;
  const service = { findAll: jest.fn(), findById: jest.fn() };

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

  it('devuelve los casos con identificador, tipo y estado', async () => {
    service.findAll.mockResolvedValue(SUMMARIES);
    const res = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
    expect(res.body).toEqual(SUMMARIES);
    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(service.findById).not.toHaveBeenCalled();
  });

  it('devuelve una lista vacía cuando no hay casos', async () => {
    service.findAll.mockResolvedValue([]);
    const res = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
    expect(res.body).toEqual([]);
  });

  it('responde 503 sin detalles internos si la BD no está disponible', async () => {
    service.findAll.mockRejectedValue(
      new ServiceUnavailableException('No fue posible consultar los casos. Inténtalo nuevamente más tarde.'),
    );
    const res = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(503);
    expect(res.body.message).toContain('No fue posible consultar los casos');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('oculta el error del motor cuando falla la consulta real', async () => {
    const failing = new CasesService({
      manager: { createQueryBuilder: () => { throw new Error('detalle privado SQL'); } },
    } as unknown as DataSource);
    await expect(failing.findAll()).rejects.toMatchObject({ status: 503 });
    await expect(failing.findAll()).rejects.not.toThrow('detalle privado');
  });
});
