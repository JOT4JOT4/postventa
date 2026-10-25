import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { DatabasePurchaseGateway } from '../../src/requests/database-purchase.gateway';
import { PurchaseGateway } from '../../src/requests/request.types';
import { RequestsController } from '../../src/requests/requests.controller';
import { RequestsService } from '../../src/requests/requests.service';
import { databaseSuite, openTestDatabase, closeTestDatabase } from './database-fixture';
import { createSharedFixture } from './shared-schema.fixture';
import { validInput, fictionalPurchase } from './fixtures';

databaseSuite('HU-01: HTTP y PostgreSQL con el esquema compartido', () => {
  let db: DataSource;
  let app: INestApplication;
  beforeAll(async () => {
    db = await openTestDatabase('hu01_http');
    await createSharedFixture(db);
    await db.runMigrations();
    const module = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [RequestsService,
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

  it('carga la venta y registra el caso completo sin sustituir Ventas por un doble', async () => {
    const purchase = await request(app.getHttpServer()).get('/postventa/compras/10').expect(200);
    expect(purchase.body).toEqual(fictionalPurchase);
    const result = await request(app.getHttpServer()).post('/postventa/solicitudes').send(validInput).expect(201);
    expect(result.body).toMatchObject({ customerId: 20, status: 'Abierto', type: 'Reclamo', purchaseItemIds: [30, 31] });
    const rows = await db.query(`SELECT r.id_reclamo, r.id_venta, r.id_cliente, m.tipo
      FROM reclamo r JOIN postventa_registro m USING (id_reclamo) WHERE id_reclamo = $1`, [result.body.id]);
    expect(rows).toEqual([{ id_reclamo: result.body.id, id_venta: 10, id_cliente: 20, tipo: 'Reclamo' }]);
  });

  it('rechaza una venta inexistente y una línea comprada por otro cliente', async () => {
    await request(app.getHttpServer()).post('/postventa/solicitudes')
      .send({ ...validInput, purchaseId: 999 }).expect(404);
    await request(app.getHttpServer()).post('/postventa/solicitudes')
      .send({ ...validInput, purchaseItemIds: [32] }).expect(400);
    expect((await db.query('SELECT count(*) FROM reclamo'))[0].count).toBe('1');
  });

  it('devuelve un error seguro si la conexión de lectura falla', async () => {
    const failingSource = { manager: { query: async () => { throw new Error('detalle privado SQL'); } } };
    const gateway = new DatabasePurchaseGateway(failingSource as unknown as DataSource);
    await expect(gateway.findById(10)).rejects.toThrow('datos compartidos');
    await expect(gateway.findById(10)).rejects.not.toThrow('detalle privado');
  });
});
