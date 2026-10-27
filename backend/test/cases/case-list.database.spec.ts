import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { CasesController } from '../../src/cases/cases.controller';
import { CasesService } from '../../src/cases/cases.service';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';

databaseSuite('HU-12: consulta de casos mediante HTTP y PostgreSQL', () => {
  let db: DataSource;
  let app: INestApplication;

  beforeAll(async () => {
    db = await openTestDatabase('hu12_data');
    await createSharedFixture(db);
    await db.runMigrations();
    const module = await Test.createTestingModule({
      controllers: [CasesController],
      providers: [CasesService, { provide: DataSource, useValue: db }],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    await closeTestDatabase(db);
  });

  it('devuelve una lista vacía cuando reclamo no tiene filas', async () => {
    const res = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
    expect(res.body).toEqual([]);
  });

  describe('con casos almacenados', () => {
    let older: number;
    let newer: number;
    let withoutRegistration: number;

    async function insertCase(sale: number, customer: number, status: string) {
      const rows: { id_reclamo: number }[] = await db.query(`
        INSERT INTO reclamo(id_venta, id_cliente, motivo, estado)
        VALUES ($1, $2, 'Motivo ficticio de prueba', $3) RETURNING id_reclamo
      `, [sale, customer, status]);
      return rows[0].id_reclamo;
    }

    beforeAll(async () => {
      older = await insertCase(10, 20, 'Abierto');
      await db.query(`INSERT INTO postventa_registro(id_reclamo, tipo, fecha_registro)
        VALUES ($1, 'Cambio', '2026-10-20T10:00:00Z')`, [older]);
      newer = await insertCase(11, 21, 'En revisión');
      await db.query(`INSERT INTO postventa_registro(id_reclamo, tipo, fecha_registro)
        VALUES ($1, 'Devolución', '2026-10-24T10:00:00Z')`, [newer]);
      withoutRegistration = await insertCase(12, 20, 'Abierto');
    });

    it('lista cada caso con los valores guardados, del más reciente al más antiguo', async () => {
      const res = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
      expect(res.body).toEqual([
        { id: newer, type: 'Devolución', status: 'En revisión', createdAt: '2026-10-24T10:00:00.000Z', purchaseId: 11, customerId: 21 },
        { id: older, type: 'Cambio', status: 'Abierto', createdAt: '2026-10-20T10:00:00.000Z', purchaseId: 10, customerId: 20 },
        { id: withoutRegistration, type: null, status: 'Abierto', createdAt: null, purchaseId: 12, customerId: 20 },
      ]);
    });

    it('refleja inmediatamente los cambios hechos en la BD', async () => {
      await db.query(`UPDATE reclamo SET estado = 'Rechazado' WHERE id_reclamo = $1`, [older]);
      const res = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
      const stored: { count: string }[] = await db.query('SELECT count(*) FROM reclamo');
      expect(res.body).toHaveLength(Number(stored[0].count));
      expect(res.body.find((item: { id: number }) => item.id === older).status).toBe('Rechazado');
    });

    it('el detalle de un caso listado coincide con su resumen', async () => {
      const list = await request(app.getHttpServer()).get('/postventa/solicitudes').expect(200);
      const summary = list.body.find((item: { id: number }) => item.id === newer);
      const detail = await request(app.getHttpServer()).get(`/postventa/solicitudes/${newer}`).expect(200);
      expect(detail.body).toMatchObject({
        id: summary.id, type: summary.type, status: summary.status,
        createdAt: summary.createdAt, purchaseId: summary.purchaseId, customerId: summary.customerId,
      });
    });

    it('responde 404 al consultar el detalle de un caso inexistente', async () => {
      await request(app.getHttpServer()).get('/postventa/solicitudes/2147483647').expect(404);
    });
  });
});
