import { DataSource } from 'typeorm';
import { ReturnsService } from '../../src/returns/returns.service';
import { ReturnEntity } from '../../src/returns/return.entity';
import { CaseWriter } from '../../src/cases/case-writer';
import { CaseStatus } from '../../src/cases/case.types';
import * as reader from '../../src/returns/return-reader';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';
import { createReturnCase, returnInput } from './return-fixture';

databaseSuite('HU-06: datos y referencias de devoluciones en PostgreSQL', () => {
  let db: DataSource;
  let service: ReturnsService;
  beforeAll(async () => {
    db = await openTestDatabase('return_data');
    await createSharedFixture(db);
    await db.runMigrations();
    service = new ReturnsService(db);
  });
  beforeEach(async () => { await db.query('DELETE FROM devolucion'); });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => closeTestDatabase(db));

  it('persiste producto canónico, cantidad, fecha sin zona horaria y motivo asociados al caso', async () => {
    const caseId = await createReturnCase(db);
    const record = await service.create(caseId, returnInput);
    expect(record).toMatchObject({ caseId, purchaseId: 10, customerId: 20, productId: 40,
      productName: 'Set ficticio A', ...returnInput });
    expect(record.id).toBeGreaterThan(0);
    const data = await service.findForCase(caseId);
    expect(data.returns).toEqual([record]);
    expect(data.products).toEqual([expect.objectContaining({ purchasedQuantity: 3, availableQuantity: 2 })]);
    expect((await db.query('SELECT estado FROM reclamo WHERE id_reclamo=$1', [caseId]))[0].estado).toBe('Aprobado');
  });

  it.each(['Abierto', 'En revisión', 'Rechazado', 'Cerrado'])('requiere aprobación; rechaza %s', async status => {
    const caseId = await createReturnCase(db, status);
    await expect(service.create(caseId, returnInput)).rejects.toMatchObject({ status: 400 });
    expect((await service.findForCase(caseId)).returns).toEqual([]);
  });

  it('identifica casos inexistentes', async () => {
    await expect(service.create(2147483647, returnInput)).rejects.toMatchObject({ status: 404 });
    await expect(service.findForCase(2147483647)).rejects.toMatchObject({ status: 404 });
  });

  it.each([31, 32, 2147483647])('rechaza línea no asociada al caso o ajena a su venta: %s', async purchaseItemId => {
    const caseId = await createReturnCase(db);
    await expect(service.create(caseId, { ...returnInput, purchaseItemId })).rejects.toMatchObject({ status: 400 });
  });

  it('no acepta una relación preexistente inconsistente con la venta original', async () => {
    const caseId = await createReturnCase(db, 'Aprobado', 32);
    await expect(service.create(caseId, { ...returnInput, purchaseItemId: 32 })).rejects.toMatchObject({ status: 400 });
  });

  it('rechaza cantidades mayores a la compra y acumuladas desde otros casos', async () => {
    const first = await createReturnCase(db);
    const second = await createReturnCase(db);
    await expect(service.create(first, { ...returnInput, quantity: 4 })).rejects.toMatchObject({ status: 400 });
    await service.create(first, { ...returnInput, quantity: 2 });
    await expect(service.create(second, { ...returnInput, quantity: 2 })).rejects.toMatchObject({ status: 400 });
    await service.create(second, returnInput);
    expect((await service.findForCase(second)).products[0].availableQuantity).toBe(0);
  });

  it('mantiene la devolución consultable después del cierre del caso', async () => {
    const caseId = await createReturnCase(db);
    const record = await service.create(caseId, returnInput);
    await new CaseWriter(db).updateStatus(caseId, { status: CaseStatus.Closed });
    expect((await service.findForCase(caseId)).returns).toEqual([record]);
  });

  it('revierte toda la escritura ante un fallo posterior y no filtra detalles internos', async () => {
    const caseId = await createReturnCase(db);
    jest.spyOn(reader, 'readReturns').mockRejectedValueOnce(new Error('SQL privado'));
    await expect(service.create(caseId, returnInput)).rejects.toMatchObject({ status: 503 });
    expect(await db.getRepository(ReturnEntity).countBy({ caseId })).toBe(0);
  });

  it('la base exige cantidad, motivo, producto canónico y relación con las líneas del caso', async () => {
    const caseId = await createReturnCase(db);
    const sql = `INSERT INTO devolucion(id_reclamo,id_detalle_ped,id_producto,cantidad,fecha_devolucion,motivo)
      VALUES ($1,$2,$3,$4,'2026-11-14',$5)`;
    for (const values of [[caseId, 30, 40, 0, 'Motivo'], [caseId, 30, 40, -1, 'Motivo'],
      [caseId, 30, 40, 1, ' '], [caseId, 31, 41, 1, 'Motivo'], [caseId, 30, 9999, 1, 'Motivo']]) {
      await expect(db.query(sql, values)).rejects.toThrow();
    }
    await service.create(caseId, returnInput);
    await expect(db.query(sql, [caseId, 30, 40, 1, 'Motivo'])).rejects.toThrow();
  });

  it('repetir migraciones conserva los casos y sus devoluciones', async () => {
    const caseId = await createReturnCase(db);
    await service.create(caseId, returnInput);
    expect(await db.runMigrations()).toEqual([]);
    expect((await service.findForCase(caseId)).returns).toHaveLength(1);
  });
});
