import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';
import { RequestsController } from '../../src/requests/requests.controller';
import { RequestsService } from '../../src/requests/requests.service';
import { DatabasePurchaseGateway } from '../../src/requests/database-purchase.gateway';
import { PurchaseGateway } from '../../src/requests/request.types';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';
import { validInput } from '../requests/fixtures';

databaseSuite('Flujo HTTP transaccional completo del alcance Sprint 2', () => {
  let db: DataSource;
  let app: INestApplication;
  beforeAll(async () => {
    db = await openTestDatabase('case_flow');
    await createSharedFixture(db);
    await db.runMigrations();
    const module = await Test.createTestingModule({
      controllers: [RequestsController, CasesController],
      providers: [RequestsService, CasesService,
        { provide: DataSource, useValue: db },
        { provide: PurchaseGateway, useValue: new DatabasePurchaseGateway(db) }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });
  afterAll(async () => {
    if (app) await app.close();
    await closeTestDatabase(db);
  });

  it.each(['Reclamo', 'Cambio', 'Devolución', 'Reembolso'])('registra y consulta el tipo %s sin perder clasificación', async type => {
    const registered = await request(app.getHttpServer()).post('/postventa/solicitudes')
      .send({ ...validInput, type }).expect(201);
    const id = registered.body.id;
    const base = `/postventa/solicitudes/${id}`;
    expect(registered.body.status).toBe('Abierto');
    const detail = await request(app.getHttpServer()).get(base).expect(200);
    expect(detail.body).toMatchObject({ type, customerId: 20, purchaseId: 10, items: [30, 31] });
    const history = await request(app.getHttpServer()).get(`${base}/historial`).expect(200);
    expect(history.body).toEqual([expect.objectContaining({ previousStatus: null, newStatus: 'Abierto' })]);
    const list = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
    expect(list.body).toContainEqual(expect.objectContaining({ id, type, status: 'Abierto' }));
    await request(app.getHttpServer()).patch(`${base}/estado`).send({ status: 'Rechazado' }).expect(400);
    await request(app.getHttpServer()).patch(`${base}/estado`)
      .send({ status: 'En revisión', description: 'Descripción ampliada del problema ficticio.' }).expect(200);
    await request(app.getHttpServer()).patch(`${base}/estado`)
      .send({ status: 'Rechazado', note: 'Antecedentes insuficientes en evaluación ficticia.' }).expect(200);
    await request(app.getHttpServer()).patch(`${base}/estado`).send({ status: 'Aprobado' }).expect(400);
    await request(app.getHttpServer()).post(`${base}/resolucion`)
      .send({ resolution: 'Se comunicó el rechazo y sus antecedentes al cliente ficticio.' }).expect(201);
    await request(app.getHttpServer()).post(`${base}/resolucion`)
      .send({ resolution: 'Duplicado.' }).expect(409);
    const finalDetail = await request(app.getHttpServer()).get(base).expect(200);
    expect(finalDetail.body).toMatchObject({ status: 'Rechazado',
      description: 'Descripción ampliada del problema ficticio.',
      resolution: { text: 'Se comunicó el rechazo y sus antecedentes al cliente ficticio.' } });
    const finalHistory = await request(app.getHttpServer()).get(`${base}/historial`).expect(200);
    expect(finalHistory.body).toHaveLength(3);
    expect(finalHistory.body[2]).toMatchObject({ previousStatus: 'En revisión', newStatus: 'Rechazado',
      note: 'Antecedentes insuficientes en evaluación ficticia.' });
  });
});
