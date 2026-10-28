import { DataSource } from 'typeorm';
import { loadDemoData, validateDemoTarget } from '../../src/database/demo-runner';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';

describe('Protección de datos ficticios', () => {
  it('rechaza destinos remotos y bases que no son de demostración', () => {
    expect(() => validateDemoTarget({ DATABASE_HOST: 'db.neon.tech', DATABASE_NAME: 'postventa' })).toThrow();
    expect(() => validateDemoTarget({ DATABASE_HOST: 'localhost', DATABASE_NAME: 'produccion' })).toThrow();
    expect(() => validateDemoTarget({ DATABASE_HOST: 'database', DATABASE_NAME: 'postventa' })).not.toThrow();
  });
});

databaseSuite('Datos iniciales reproducibles del Sprint 2', () => {
  let db: DataSource;
  const tables = ['cliente', 'pedido', 'venta', 'inv_producto', 'detalle_pedido',
    'reclamo', 'postventa_registro', 'postventa_registro_producto', 'postventa_historial', 'postventa_resolucion'];
  beforeAll(async () => {
    db = await openTestDatabase('demo_seed');
    await loadDemoData(db, 'prepare');
    await db.runMigrations();
  });
  afterAll(async () => closeTestDatabase(db));

  async function counts() {
    const result: Record<string, number> = {};
    for (const table of tables) result[table] = Number((await db.query(`SELECT count(*) FROM ${table}`))[0].count);
    return result;
  }

  it('carga al menos diez filas por tabla funcional y permite repetir la carga', async () => {
    await loadDemoData(db, 'seed');
    const before = await counts();
    for (const count of Object.values(before)) expect(count).toBeGreaterThanOrEqual(10);
    expect(before.reclamo).toBe(20);
    expect(before.postventa_resolucion).toBe(10);
    await Promise.all([loadDemoData(db, 'seed'), loadDemoData(db, 'seed')]);
    await loadDemoData(db, 'prepare');
    expect(await counts()).toEqual(before);
  });

  it('conserva modificaciones del usuario y no duplica sus historiales', async () => {
    await db.query("UPDATE reclamo SET motivo='Información conservada' WHERE id_reclamo=100001");
    const before = await counts();
    await loadDemoData(db, 'seed');
    expect((await db.query('SELECT motivo FROM reclamo WHERE id_reclamo=100001'))[0].motivo)
      .toBe('Información conservada');
    expect(await counts()).toEqual(before);
  });

  it('los casos coinciden con el cliente y los productos de su venta', async () => {
    const invalid = await db.query(`SELECT r.id_reclamo FROM reclamo r
      JOIN venta v ON v.id_venta=r.id_venta JOIN pedido p ON p.id_pedido=v.id_pedido
      JOIN postventa_registro_producto rp ON rp.id_reclamo=r.id_reclamo
      JOIN detalle_pedido dp ON dp.id_detalle_ped=rp.id_detalle_ped
      WHERE r.id_cliente<>p.id_cliente OR dp.id_pedido<>p.id_pedido`);
    expect(invalid).toEqual([]);
    expect(await db.query(`SELECT h.id_historial FROM postventa_historial h
      WHERE h.estado_nuevo='Rechazado' AND length(trim(coalesce(h.nota,'')))=0`)).toEqual([]);
  });
});
