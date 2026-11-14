import { DataSource } from 'typeorm';
import { ReturnsService } from '../../src/returns/returns.service';
import { ReturnEntity } from '../../src/returns/return.entity';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';
import { createReturnCase, returnInput } from './return-fixture';

databaseSuite('HU-06: serialización de devoluciones simultáneas', () => {
  let db: DataSource;
  let service: ReturnsService;
  beforeAll(async () => {
    db = await openTestDatabase('return_concurrency');
    await createSharedFixture(db);
    await db.runMigrations();
    service = new ReturnsService(db);
  });
  beforeEach(async () => { await db.query('DELETE FROM devolucion'); });
  afterAll(async () => closeTestDatabase(db));

  it('evita duplicar una devolución enviada dos veces sobre el mismo caso', async () => {
    const caseId = await createReturnCase(db);
    const results = await Promise.allSettled([service.create(caseId, returnInput), service.create(caseId, returnInput)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected'))
      .toMatchObject({ status: 'rejected', reason: { status: 409 } });
    expect(await db.getRepository(ReturnEntity).countBy({ caseId })).toBe(1);
  });

  it('evita superar la cantidad comprada desde casos diferentes de la misma venta', async () => {
    const first = await createReturnCase(db);
    const second = await createReturnCase(db);
    const results = await Promise.allSettled([
      service.create(first, { ...returnInput, quantity: 2 }),
      service.create(second, { ...returnInput, quantity: 2 }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected'))
      .toMatchObject({ status: 'rejected', reason: { status: 400 } });
    expect(await db.query('SELECT sum(cantidad)::integer AS total FROM devolucion')).toEqual([{ total: 2 }]);
  });

  it('revalida el estado cuando un cierre concurrente obtiene primero el bloqueo', async () => {
    const caseId = await createReturnCase(db);
    const closer = db.createQueryRunner();
    await closer.connect();
    await closer.startTransaction();
    try {
      await closer.query("UPDATE reclamo SET estado='Cerrado' WHERE id_reclamo=$1", [caseId]);
      const result = Promise.allSettled([service.create(caseId, returnInput)]);
      await closer.commitTransaction();
      expect((await result)[0]).toMatchObject({ status: 'rejected', reason: { status: 400 } });
      expect(await db.getRepository(ReturnEntity).countBy({ caseId })).toBe(0);
    } finally {
      if (closer.isTransactionActive) await closer.rollbackTransaction();
      await closer.release();
    }
  });
});
