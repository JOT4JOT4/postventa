import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { ReturnsController } from '../../src/returns/returns.controller';
import { ReturnsService } from '../../src/returns/returns.service';
import { RequestsService } from '../../src/requests/requests.service';
import { DatabasePurchaseGateway } from '../../src/requests/database-purchase.gateway';
import { CasesService } from '../../src/cases/cases.service';
import { CaseStatus } from '../../src/cases/case.types';
import { RequestType } from '../../src/requests/request.types';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';
import { returnInput } from './return-fixture';

databaseSuite('HU-06: registro HTTP conectado a la compra y al caso', () => {
  let db: DataSource;
  let app: INestApplication;
  let caseId: number;
  let cases: CasesService;
  beforeAll(async () => {
    db = await openTestDatabase('return_http');
    await createSharedFixture(db);
    await db.runMigrations();
    cases = new CasesService(db);
    const registered = await new RequestsService(new DatabasePurchaseGateway(db), db).create({
      purchaseId: 10, purchaseItemIds: [30], type: RequestType.Return, reason: 'Devolución ficticia de producto.',
    });
    caseId = registered.id;
    const module = await Test.createTestingModule({
      controllers: [ReturnsController], providers: [ReturnsService, { provide: DataSource, useValue: db }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(async () => {
    if (app) await app.close();
    await closeTestDatabase(db);
  });

  it('requiere aprobación, registra los siete criterios y recupera la devolución tras reconectar', async () => {
    const path = `/postventa/solicitudes/${caseId}/devoluciones`;
    await request(app.getHttpServer()).post(path).send(returnInput).expect(400);
    await cases.updateStatus(caseId, { status: CaseStatus.InReview });
    await cases.updateStatus(caseId, { status: CaseStatus.Approved });
    const created = await request(app.getHttpServer()).post(path).send(returnInput).expect(201);
    expect(created.body).toMatchObject({ caseId, productId: 40, purchaseId: 10, customerId: 20, ...returnInput });
    await db.destroy();
    await db.initialize();
    const stored = await request(app.getHttpServer()).get(path).expect(200);
    expect(stored.body.returns).toEqual([created.body]);
    await request(app.getHttpServer()).post(path).send(returnInput).expect(409);
    expect((await cases.findById(caseId)).status).toBe('Aprobado');
    expect(await cases.getHistory(caseId)).toHaveLength(3);
  });
});
