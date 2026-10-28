import { CaseHistoryEntity } from '../../src/cases/case-history.entity';
import { DataSource } from 'typeorm';
import { RequestEntity } from '../../src/requests/request.entity';
import { RequestItemEntity } from '../../src/requests/request-item.entity';
import { RequestsService } from '../../src/requests/requests.service';
import { RequestType } from '../../src/requests/request.types';
import { RequestRegistrationEntity } from '../../src/requests/request-registration.entity';
import { DatabasePurchaseGateway } from '../../src/requests/database-purchase.gateway';
import { validInput, fictionalPurchase } from './fixtures';
import { databaseSuite, openTestDatabase, closeTestDatabase } from './database-fixture';
import { createSharedFixture } from './shared-schema.fixture';

databaseSuite('HU-01: persistencia PostgreSQL en esquema aislado', () => {
  let db: DataSource;
  let service: RequestsService;

  beforeAll(async () => {
    db = await openTestDatabase('hu01_data');
    await createSharedFixture(db);
    await db.runMigrations();
    service = new RequestsService(new DatabasePurchaseGateway(db), db);
  });

  afterAll(async () => closeTestDatabase(db));

  const input = { ...validInput, type: RequestType.Complaint };

  it('guarda cabecera, cliente y líneas, y permite leerlos nuevamente', async () => {
    const saved = await service.create(input);
    const found = await db.getRepository(RequestEntity).findOneByOrFail({ id: saved.id });
    const lines = await db.getRepository(RequestItemEntity).findBy({ requestId: saved.id });
    expect(found).toMatchObject({ purchaseId: 10, customerId: 20, status: 'Abierto', reason: input.reason });
    expect(lines.map((line) => line.purchaseItemId).sort()).toEqual([30, 31]);
    const metadata = await db.getRepository(RequestRegistrationEntity).findOneByOrFail({ requestId: saved.id });
    expect(metadata.createdAt).toBeInstanceOf(Date);
    expect(metadata.type).toBe('Reclamo');
    expect(await db.getRepository(CaseHistoryEntity).findBy({ caseId: saved.id })).toEqual([
      expect.objectContaining({ previousStatus: null, newStatus: 'Abierto', note: 'Registro inicial de solicitud' }),
    ]);
  });

  it('genera IDs únicos con registros concurrentes', async () => {
    const results = await Promise.all(Array.from({ length: 10 }, () => service.create(input)));
    expect(new Set(results.map((value) => value.id)).size).toBe(10);
  });

  it('revierte la cabecera si una línea no puede guardarse', async () => {
    const before = await db.getRepository(RequestEntity).count();
    const historyBefore = await db.getRepository(CaseHistoryEntity).count();
    await expect(service.create({ ...input, purchaseItemIds: [30, 30] })).rejects.toThrow();
    expect(await db.getRepository(CaseHistoryEntity).count()).toBe(historyBefore);
    expect(await db.getRepository(RequestEntity).count()).toBe(before);
  });

  it('rechaza detalles sin caso y motivos vacíos directamente en la BD', async () => {
    await expect(db.query(
      'INSERT INTO postventa_registro_producto(id_reclamo, id_detalle_ped) VALUES ($1, $2)', [2147483647, 30],
    )).rejects.toThrow();
    await expect(db.query(
      'INSERT INTO reclamo(id_venta, id_cliente, motivo) VALUES (10, 20, $1)', [' '],
    )).rejects.toThrow();
  });

  it('consulta la venta, su cliente y sus productos mediante las relaciones del diagrama', async () => {
    expect(await service.purchaseContext(10)).toEqual(fictionalPurchase);
    expect((await service.purchaseContext(11)).customer.id).toBe(21);
    expect((await service.purchaseContext(12)).items).toEqual([]);
    await expect(service.purchaseContext(999)).rejects.toThrow('no existe');
  });

  it('rechaza un producto de otra venta sin guardar ningún caso', async () => {
    const before = await db.getRepository(RequestEntity).count();
    await expect(service.create({ ...input, purchaseItemIds: [32] })).rejects.toThrow('no pertenecen');
    expect(await db.getRepository(RequestEntity).count()).toBe(before);
  });

  it('impone claves foráneas hacia venta, cliente y detalle del pedido', async () => {
    await expect(db.query(`INSERT INTO reclamo(id_venta, id_cliente, motivo)
      VALUES (999, 20, 'Prueba ficticia')`)).rejects.toThrow();
    await expect(db.query(`INSERT INTO reclamo(id_venta, id_cliente, motivo)
      VALUES (10, 999, 'Prueba ficticia')`)).rejects.toThrow();
    const saved = await service.create(input);
    await expect(db.query(`INSERT INTO postventa_registro_producto(id_reclamo, id_detalle_ped)
      VALUES ($1, 999)`, [saved.id])).rejects.toThrow();
  });

  it('mantiene estable el cliente de la compra mientras se registra el caso', async () => {
    const reader = db.createQueryRunner();
    const writer = db.createQueryRunner();
    await reader.connect();
    await writer.connect();
    await reader.startTransaction();
    await writer.startTransaction();
    try {
      await new DatabasePurchaseGateway(db).findById(10, reader.manager);
      await writer.query("SET LOCAL lock_timeout = '100ms'");
      await expect(writer.query('UPDATE pedido SET id_cliente = 21 WHERE id_pedido = 100'))
        .rejects.toMatchObject({ driverError: { code: '55P03' } });
    } finally {
      await writer.rollbackTransaction();
      await reader.rollbackTransaction();
      await writer.release();
      await reader.release();
    }
  });
});
