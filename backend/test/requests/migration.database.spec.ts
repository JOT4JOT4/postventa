import { DataSource } from 'typeorm';
import { databaseSuite, openTestDatabase, closeTestDatabase } from './database-fixture';
import { createSharedFixture } from './shared-schema.fixture';
import { CreateRequests1792800000000 } from '../../src/database/migrations/1792800000000-CreateRequests';

databaseSuite('HU-01: actualización del modelo sin pérdida de datos', () => {
  let db: DataSource;
  beforeEach(async () => { db = await openTestDatabase('hu01_upgrade'); });
  afterEach(async () => closeTestDatabase(db));

  async function createLegacy(reason = 'Caso ficticio anterior', customerId = 20) {
    const runner = db.createQueryRunner();
    await runner.connect();
    try { await new CreateRequests1792800000000().up(runner); }
    finally { await runner.release(); }
    await db.query(`INSERT INTO peticion(id_peticion, id_venta, id_cliente, tipo, motivo)
      VALUES (500, 10, $1, 'Cambio', $2)`, [customerId, reason]);
    await db.query('INSERT INTO detalle_peticion(id_peticion, id_detalle_pedido) VALUES (500, 30)');
    await db.query(`CREATE TABLE migrations (
      id serial PRIMARY KEY, timestamp bigint NOT NULL, name varchar NOT NULL
    )`);
    await db.query(`INSERT INTO migrations(timestamp, name)
      VALUES (1792800000000, 'CreateRequests1792800000000')`);
  }

  it('conserva casos anteriores, su ID, tipo, motivo y productos; no borra las tablas de origen', async () => {
    await createSharedFixture(db);
    await createLegacy();
    await db.runMigrations();
    expect(await db.query('SELECT id_reclamo, motivo FROM reclamo')).toEqual([
      { id_reclamo: 500, motivo: 'Caso ficticio anterior' },
    ]);
    expect(await db.query('SELECT tipo FROM postventa_registro')).toEqual([{ tipo: 'Cambio' }]);
    expect(await db.query('SELECT id_detalle_ped FROM postventa_registro_producto'))
      .toEqual([{ id_detalle_ped: 30 }]);
    expect(await db.query('SELECT id_peticion FROM peticion')).toEqual([{ id_peticion: 500 }]);
    const next = await db.query(`INSERT INTO reclamo(id_venta, id_cliente, motivo)
      VALUES (10, 20, 'Prueba posterior') RETURNING id_reclamo`);
    expect(next[0].id_reclamo).toBeGreaterThan(500);
    expect(await db.runMigrations()).toEqual([]);
  });

  it('adopta RECLAMO existente sin reescribir sus casos y agrega generación de IDs si falta', async () => {
    await createSharedFixture(db);
    await db.query(`CREATE TABLE reclamo (
      id_reclamo integer PRIMARY KEY, id_venta integer NOT NULL, id_cliente integer NOT NULL,
      motivo text NOT NULL, estado text NOT NULL
    ); INSERT INTO reclamo VALUES (700, 10, 20, 'Caso compartido ficticio', 'Abierto')`);
    await db.runMigrations();
    expect(await db.query('SELECT id_reclamo FROM reclamo')).toEqual([{ id_reclamo: 700 }]);
    const next = await db.query(`INSERT INTO reclamo(id_venta, id_cliente, motivo, estado)
      VALUES (10, 20, 'Caso nuevo ficticio', 'Abierto') RETURNING id_reclamo`);
    expect(next[0].id_reclamo).toBeGreaterThan(700);
  });

  it('falla sin tablas compartidas y no crea maestros ni deja una migración parcial', async () => {
    await expect(db.runMigrations()).rejects.toThrow('estructura compartida');
    expect(await db.query("SELECT to_regclass('venta') AS name")).toEqual([{ name: null }]);
    expect(await db.query("SELECT to_regclass('reclamo') AS name")).toEqual([{ name: null }]);
  });

  it('detiene una colisión de IDs sin sobrescribir ni borrar los registros previos', async () => {
    await createSharedFixture(db);
    await createLegacy();
    await db.query(`CREATE TABLE reclamo (
      id_reclamo integer PRIMARY KEY, id_venta integer, id_cliente integer, motivo text, estado text
    ); INSERT INTO reclamo VALUES (500, 10, 20, 'Conservar este caso ficticio', 'Abierto')`);
    await expect(db.runMigrations()).rejects.toThrow();
    expect((await db.query('SELECT motivo FROM reclamo'))[0].motivo).toBe('Conservar este caso ficticio');
    expect((await db.query('SELECT id_peticion FROM peticion'))[0].id_peticion).toBe(500);
    expect(await db.query("SELECT to_regclass('postventa_registro') AS name")).toEqual([{ name: null }]);
  });

  it('no copia un caso antiguo asociado al cliente incorrecto', async () => {
    await createSharedFixture(db);
    await createLegacy('Caso ficticio inconsistente', 21);
    await expect(db.runMigrations()).rejects.toThrow('conciliarse');
    expect((await db.query('SELECT id_cliente FROM peticion'))[0].id_cliente).toBe(21);
  });
});
