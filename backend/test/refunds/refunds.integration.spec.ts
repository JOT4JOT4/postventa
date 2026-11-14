import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { RefundsController } from '../../src/refunds/refunds.controller';
import { RefundsService } from '../../src/refunds/refunds.service';
import { RequestsService } from '../../src/requests/requests.service';
import { DatabasePurchaseGateway } from '../../src/requests/database-purchase.gateway';
import { CasesService } from '../../src/cases/cases.service';
import { CaseStatus } from '../../src/cases/case.types';
import { RequestType } from '../../src/requests/request.types';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';

databaseSuite('HU-10: HTTP conectado al caso, compra y PostgreSQL', () => {
  let db: DataSource;
  let app: INestApplication;
  let caseId: number;
  let cases: CasesService;
  beforeAll(async () => {
    db = await openTestDatabase('refund_http');
    await createSharedFixture(db);
    await db.runMigrations();
    cases = new CasesService(db);
    const registered = await new RequestsService(new DatabasePurchaseGateway(db), db).create({
      purchaseId: 10, purchaseItemIds: [30], type: RequestType.Refund, reason: 'Solicitud ficticia de reembolso.',
    });
    caseId = registered.id;
    const module = await Test.createTestingModule({
      controllers: [RefundsController], providers: [RefundsService, { provide: DataSource, useValue: db }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(async () => {
    if (app) await app.close();
    await closeTestDatabase(db);
  });

  it('requiere aprobación, registra el monto y permite recuperar todos sus antecedentes', async () => {
    const path = `/postventa/solicitudes/${caseId}/reembolsos`;
    await request(app.getHttpServer()).post(path).send({ amount: '1234.56' }).expect(400);
    await cases.updateStatus(caseId, { status: CaseStatus.InReview });
    await cases.updateStatus(caseId, { status: CaseStatus.Approved });
    const created = await request(app.getHttpServer()).post(path).send({ amount: '1234.56' }).expect(201);
    expect(created.body).toMatchObject({ caseId, purchaseId: 10, customerId: 20,
      amount: '1234.56', status: 'Pendiente' });
    const stored = await request(app.getHttpServer()).get(path).expect(200);
    expect(stored.body).toEqual([created.body]);
    await request(app.getHttpServer()).post(path).send({ amount: '50' }).expect(409);
    expect((await cases.findById(caseId)).status).toBe('Aprobado');
    expect(await cases.getHistory(caseId)).toHaveLength(3);
  });
});
