import { DataSource } from 'typeorm';
import { CasesService } from '../../src/cases/cases.service';
import { CaseStatus } from '../../src/cases/case.types';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';

databaseSuite('Evaluación y concurrencia con PostgreSQL real', () => {
  let db: DataSource;
  let service: CasesService;
  beforeAll(async () => {
    db = await openTestDatabase('case_concurrency');
    await createSharedFixture(db);
    await db.runMigrations();
    service = new CasesService(db);
  });
  afterAll(async () => closeTestDatabase(db));

  async function createCase() {
    const [row] = await db.query(`INSERT INTO reclamo(id_venta,id_cliente,motivo,estado)
      VALUES (10,20,'Reclamo ficticio de concurrencia','Abierto') RETURNING id_reclamo`);
    return row.id_reclamo as number;
  }

  it('exige motivo de rechazo incluso al invocar el servicio sin HTTP', async () => {
    const id = await createCase();
    await expect(service.updateStatus(id, { status: CaseStatus.Rejected }))
      .rejects.toMatchObject({ status: 400 });
    expect((await service.findById(id)).status).toBe('Abierto');
    expect(await service.getHistory(id)).toEqual([]);
  });

  it('persiste aprobación y motivo de rechazo; un rechazo impide avances posteriores', async () => {
    const id = await createCase();
    await service.updateStatus(id, { status: CaseStatus.InReview });
    await service.updateStatus(id, { status: CaseStatus.Approved, note: 'Antecedentes válidos.' });
    expect((await service.findById(id)).status).toBe('Aprobado');
    const rejected = await createCase();
    await service.updateStatus(rejected, { status: CaseStatus.Rejected, note: 'Compra fuera de cobertura.' });
    expect((await service.getHistory(rejected))[0].note).toBe('Compra fuera de cobertura.');
    for (const status of [CaseStatus.Open, CaseStatus.InReview, CaseStatus.Approved, CaseStatus.Closed]) {
      await expect(service.updateStatus(rejected, { status })).rejects.toMatchObject({ status: 400 });
    }
  });

  it('serializa rechazo y revisión concurrentes sin reabrir el caso', async () => {
    const id = await createCase();
    const blocker = db.createQueryRunner();
    await blocker.connect();
    await blocker.startTransaction();
    try {
      await blocker.query('SELECT id_reclamo FROM reclamo WHERE id_reclamo=$1 FOR UPDATE', [id]);
      const operations = [
        service.updateStatus(id, { status: CaseStatus.Rejected, note: 'Rechazo concurrente justificado.' }),
        service.updateStatus(id, { status: CaseStatus.InReview }),
      ];
      // Adjuntar manejadores antes de desbloquear evita rechazos sin observar.
      const resultsPromise = Promise.allSettled(operations);
      await blocker.commitTransaction();
      const results = await resultsPromise;
      expect(results[0].status).toBe('fulfilled');
      const detail = await service.findById(id);
      expect(detail.status).toBe('Rechazado');
      const history = await service.getHistory(id);
      expect(history.at(-1)?.newStatus).toBe('Rechazado');
      for (let index = 1; index < history.length; index++) {
        expect(history[index].previousStatus).toBe(history[index - 1].newStatus);
      }
    } finally {
      if (blocker.isTransactionActive) await blocker.rollbackTransaction();
      await blocker.release();
    }
  });

  it('una única resolución gana y la concurrente recibe 409', async () => {
    const id = await createCase();
    await service.updateStatus(id, { status: CaseStatus.Rejected, note: 'Motivo ficticio de rechazo.' });
    const results = await Promise.allSettled([
      service.resolve(id, { resolution: 'Resultado ficticio A.' }),
      service.resolve(id, { resolution: 'Resultado ficticio B.' }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const failure = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
    expect(failure.reason).toMatchObject({ status: 409 });
    expect((await db.query('SELECT count(*) FROM postventa_resolucion WHERE id_reclamo=$1', [id]))[0].count).toBe('1');
  });
});
