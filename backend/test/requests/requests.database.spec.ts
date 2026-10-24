import { DataSource } from 'typeorm';
import { CreateRequests1792800000000 } from '../../src/database/migrations/1792800000000-CreateRequests';
import { RequestEntity } from '../../src/requests/request.entity';
import { RequestItemEntity } from '../../src/requests/request-item.entity';
import { RequestsService } from '../../src/requests/requests.service';
import { RequestType } from '../../src/requests/request.types';
import { fictionalPurchase, validInput } from './fixtures';

const databaseUrl = process.env.POSTVENTA_TEST_DATABASE_URL;
const databaseSuite = databaseUrl ? describe : describe.skip;

databaseSuite('HU-01: persistencia PostgreSQL en esquema aislado', () => {
  let db: DataSource;
  let service: RequestsService;
  const schema = `hu01_test_${Date.now()}`;

  beforeAll(async () => {
    if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
      throw new Error('Utiliza exclusivamente una base cuyo nombre termine en _test.');
    }
    db = new DataSource({
      type: 'postgres', url: databaseUrl, schema,
      entities: [RequestEntity, RequestItemEntity], synchronize: false,
      extra: { options: `-c search_path=${schema}` },
    });
    await db.initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    const runner = db.createQueryRunner();
    await runner.connect();
    try { await new CreateRequests1792800000000().up(runner); }
    finally { await runner.release(); }
    service = new RequestsService({ findById: async () => fictionalPurchase }, db);
  });

  afterAll(async () => {
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await db.destroy();
    }
  });

  const input = { ...validInput, type: RequestType.Complaint };

  it('guarda cabecera, cliente y líneas, y permite leerlos nuevamente', async () => {
    const saved = await service.create(input);
    const found = await db.getRepository(RequestEntity).findOneByOrFail({ id: saved.id });
    const lines = await db.getRepository(RequestItemEntity).findBy({ requestId: saved.id });
    expect(found).toMatchObject({ purchaseId: 10, customerId: 20, status: 'Abierto', reason: input.reason });
    expect(lines.map((line) => line.purchaseItemId).sort()).toEqual([30, 31]);
    expect(found.createdAt).toBeInstanceOf(Date);
  });

  it('genera IDs únicos con registros concurrentes', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => service.create(input)));
    expect(new Set(results.map((value) => value.id)).size).toBe(10);
  });

  it('revierte la cabecera si una línea no puede guardarse', async () => {
    const before = await db.getRepository(RequestEntity).count();
    await expect(service.create({ ...input, purchaseItemIds: [30, 30] })).rejects.toThrow();
    expect(await db.getRepository(RequestEntity).count()).toBe(before);
  });

  it('rechaza detalles sin petición y motivos vacíos directamente en la BD', async () => {
    await expect(db.query(
      'INSERT INTO detalle_peticion(id_peticion, id_detalle_pedido) VALUES ($1, $2)', [2147483647, 30],
    )).rejects.toThrow();
    await expect(db.query(
      'INSERT INTO peticion(id_venta, id_cliente, tipo, motivo) VALUES (10, 20, $1, $2)', ['Reclamo', ' '],
    )).rejects.toThrow();
  });
});
