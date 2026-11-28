import { DataSource } from 'typeorm';
import { RefundsService } from '../../src/refunds/refunds.service';
import { RefundEntity } from '../../src/refunds/refund.entity';
import { CaseWriter } from '../../src/cases/case-writer';
import { CaseStatus } from '../../src/cases/case.types';
import * as reader from '../../src/refunds/refund-reader';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';

databaseSuite('HU-10: persistencia, referencias y concurrencia de reembolsos', () => {
  let db: DataSource;
  let service: RefundsService;
  beforeAll(async () => {
    db = await openTestDatabase('refund_data');
    await createSharedFixture(db);
    await db.runMigrations();
    service = new RefundsService(db);
  });
  afterAll(async () => closeTestDatabase(db));
  afterEach(() => jest.restoreAllMocks());

  async function caseWithStatus(status = 'Aprobado') {
    const [row] = await db.query(`INSERT INTO reclamo(id_venta,id_cliente,motivo,estado)
      VALUES (10,20,'Caso ficticio para reembolso',$1) RETURNING id_reclamo`, [status]);
    return row.id_reclamo as number;
  }

  it('deriva compra y cliente del caso; guarda monto exacto, fecha y estado pendiente', async () => {
    const caseId = await caseWithStatus();
    const refund = await service.create(caseId, { amount: '1500.25' });
    expect(refund).toMatchObject({ caseId, purchaseId: 10, customerId: 20, amount: '1500.25', status: 'Pendiente' });
    expect(refund.id).toBeGreaterThan(0);
    expect(refund.requestedAt).toBeInstanceOf(Date);
    expect(await service.findForCase(caseId)).toEqual([refund]);
    expect((await db.query('SELECT estado FROM reclamo WHERE id_reclamo=$1', [caseId]))[0].estado).toBe('Aprobado');
  });

  it.each(['Abierto', 'En revisión', 'Rechazado', 'Cerrado'])('no genera reembolsos para estado %s', async status => {
    const caseId = await caseWithStatus(status);
    await expect(service.create(caseId, { amount: '10' })).rejects.toMatchObject({ status: 400 });
    expect(await service.findForCase(caseId)).toEqual([]);
  });

  it('identifica un caso inexistente sin inventar antecedentes', async () => {
    await expect(service.create(2147483647, { amount: '10' })).rejects.toMatchObject({ status: 404 });
    await expect(service.findForCase(2147483647)).rejects.toMatchObject({ status: 404 });
  });

  it('admite una sola solicitud aunque se intente registrar simultáneamente', async () => {
    const caseId = await caseWithStatus();
    const results = await Promise.allSettled([
      service.create(caseId, { amount: '20' }), service.create(caseId, { amount: '30' }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ status: 409 });
    expect(await db.getRepository(RefundEntity).countBy({ caseId })).toBe(1);
  });

  it('mantiene el reembolso consultable cuando el caso posteriormente se cierra', async () => {
    const caseId = await caseWithStatus();
    await service.create(caseId, { amount: '50' });
    await new CaseWriter(db).updateStatus(caseId, { status: CaseStatus.Closed });
    expect(await service.findForCase(caseId)).toEqual([expect.objectContaining({ amount: '50.00' })]);
  });

  it('revalida la aprobación si un cierre concurrente obtiene primero el bloqueo', async () => {
    const caseId = await caseWithStatus();
    const closer = db.createQueryRunner();
    await closer.connect();
    await closer.startTransaction();
    try {
      await closer.query("UPDATE reclamo SET estado='Cerrado' WHERE id_reclamo=$1", [caseId]);
      const result = Promise.allSettled([service.create(caseId, { amount: '10' })]);
      await closer.commitTransaction();
      expect((await result)[0]).toMatchObject({ status: 'rejected', reason: { status: 400 } });
      expect(await db.getRepository(RefundEntity).countBy({ caseId })).toBe(0);
    } finally {
      if (closer.isTransactionActive) await closer.rollbackTransaction();
      await closer.release();
    }
  });

  it('la base impone FK, monto positivo y unicidad sin depender del formulario', async () => {
    const caseId = await caseWithStatus();
    await expect(db.query(`INSERT INTO reembolso(id_reclamo,monto_reembolsado)
      VALUES (2147483647,10)`)).rejects.toThrow();
    for (const amount of ['0', '-1']) {
      await expect(db.query('INSERT INTO reembolso(id_reclamo,monto_reembolsado) VALUES ($1,$2)',
        [caseId, amount])).rejects.toThrow();
    }
    await service.create(caseId, { amount: '0.01' });
    await expect(db.query('INSERT INTO reembolso(id_reclamo,monto_reembolsado) VALUES ($1,10)', [caseId]))
      .rejects.toThrow();
  });

  it('revierte una escritura si no puede completar la operación y oculta errores internos', async () => {
    const caseId = await caseWithStatus();
    jest.spyOn(reader, 'readRefunds').mockRejectedValueOnce(new Error('SQL privado'));
    await expect(service.create(caseId, { amount: '12' })).rejects.toMatchObject({ status: 503 });
    expect(await db.getRepository(RefundEntity).countBy({ caseId })).toBe(0);
  });

  it('la migración es repetible mediante su historial y conserva los casos', async () => {
    const before = await db.query('SELECT count(*) FROM reclamo');
    expect(await db.runMigrations()).toEqual([]);
    expect(await db.query('SELECT count(*) FROM reclamo')).toEqual(before);
  });

  it('bloquea reembolsos en casos de Cambio y exige devolución previa en casos de Devolución', async () => {
    const exchangeCase = await caseWithStatus('Aprobado');
    await db.query("INSERT INTO postventa_registro(id_reclamo, tipo) VALUES ($1, 'Cambio')", [exchangeCase]);
    await expect(service.create(exchangeCase, { amount: '100' })).rejects.toMatchObject({ status: 400 });

    const returnCase = await caseWithStatus('Aprobado');
    await db.query("INSERT INTO postventa_registro(id_reclamo, tipo) VALUES ($1, 'Devolución')", [returnCase]);
    await db.query('INSERT INTO postventa_registro_producto(id_reclamo, id_detalle_ped) VALUES ($1, 30)', [returnCase]);
    await expect(service.create(returnCase, { amount: '100' })).rejects.toMatchObject({ status: 400 });

    await db.query(
      `INSERT INTO devolucion(id_reclamo, id_detalle_ped, id_producto, cantidad, fecha_devolucion, motivo)
       VALUES ($1, 30, 40, 1, '2026-11-27', 'Retorno previo al reembolso')`,
      [returnCase],
    );
    const refund = await service.create(returnCase, { amount: '100' });
    expect(refund).toMatchObject({ caseId: returnCase, amount: '100.00', status: 'Pendiente' });
  });
});
