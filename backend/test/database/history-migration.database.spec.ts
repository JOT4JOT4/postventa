import { DataSource } from 'typeorm';
import { BackfillInitialHistory1793088000000 } from '../../src/database/migrations/1793088000000-BackfillInitialHistory';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';

databaseSuite('Recuperación no destructiva de historial previo', () => {
  let db: DataSource;
  beforeAll(async () => {
    db = await openTestDatabase('history_migration');
    await createSharedFixture(db);
    await db.runMigrations();
  });
  afterAll(async () => closeTestDatabase(db));

  it('recupera el inicio conocido y conserva cambios y fechas previos', async () => {
    const [row] = await db.query(`INSERT INTO reclamo(id_venta,id_cliente,motivo,estado)
      VALUES (10,20,'Caso previo ficticio','En revisión') RETURNING id_reclamo`);
    const id = row.id_reclamo;
    await db.query(`INSERT INTO postventa_registro(id_reclamo,tipo,fecha_registro)
      VALUES ($1,'Reclamo','2026-10-25T10:00:00Z')`, [id]);
    await db.query(`INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
      VALUES ($1,'Abierto','En revisión','Nota original','2026-10-26T10:00:00Z')`, [id]);
    const runner = db.createQueryRunner();
    await runner.connect();
    try {
      const migration = new BackfillInitialHistory1793088000000();
      await migration.up(runner);
      await migration.up(runner);
      const history = await db.query(`SELECT estado_anterior,estado_nuevo,nota,fecha_cambio
        FROM postventa_historial WHERE id_reclamo=$1 ORDER BY fecha_cambio`, [id]);
      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({ estado_anterior: null, estado_nuevo: 'Abierto',
        fecha_cambio: new Date('2026-10-25T10:00:00Z') });
      expect(history[1]).toMatchObject({ nota: 'Nota original', fecha_cambio: new Date('2026-10-26T10:00:00Z') });
      expect((await db.query('SELECT estado FROM reclamo WHERE id_reclamo=$1', [id]))[0].estado).toBe('En revisión');
    } finally { await runner.release(); }
  });

  it('no inventa un estado inicial histórico cuando no existen metadatos', async () => {
    const [row] = await db.query(`INSERT INTO reclamo(id_venta,id_cliente,motivo,estado)
      VALUES (10,20,'Caso sin metadatos','Rechazado') RETURNING id_reclamo`);
    const runner = db.createQueryRunner();
    await runner.connect();
    try {
      await new BackfillInitialHistory1793088000000().up(runner);
      const [history] = await db.query('SELECT estado_nuevo,nota FROM postventa_historial WHERE id_reclamo=$1', [row.id_reclamo]);
      expect(history.estado_nuevo).toBe('Rechazado');
      expect(history.nota).toContain('fecha inicial no disponible');
    } finally { await runner.release(); }
  });
});
