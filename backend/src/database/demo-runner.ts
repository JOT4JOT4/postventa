import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import database from './data-source';

export function validateDemoTarget(environment: NodeJS.ProcessEnv): void {
  const host = environment.DATABASE_HOST ?? 'localhost';
  const name = environment.DATABASE_NAME ?? '';
  if (!['localhost', '127.0.0.1', '::1', 'database'].includes(host) ||
      !(name === 'postventa' || name === 'postventa_demo' || name.endsWith('_test'))) {
    throw new Error('Los datos ficticios solo se pueden cargar en una base local de demostración.');
  }
}

export async function loadDemoData(db: DataSource, mode: string): Promise<void> {
  if (!['prepare', 'seed'].includes(mode)) throw new Error('Indica prepare o seed.');
  const file = mode === 'prepare'
    ? join(__dirname, '../../../shared-schema.sql')
    : join(__dirname, '../../database/demo/cases.sql');
  const sql = await readFile(file, 'utf8');
  await db.transaction(async manager => {
    await manager.query('SELECT pg_advisory_xact_lock(1793000001)');
    await manager.query(sql);
  });
}

async function main(): Promise<void> {
  if (process.env.POSTVENTA_DEMO_DATA !== 'true') return;
  validateDemoTarget(process.env);
  try {
    await database.initialize();
    await loadDemoData(database, process.argv[2]);
    console.log('Carga local de datos ficticios completada.');
  } finally {
    if (database.isInitialized) await database.destroy();
  }
}

if (require.main === module) {
  main().catch(() => {
    console.error('No fue posible cargar los datos ficticios. Revisa el destino local y las migraciones.');
    process.exitCode = 1;
  });
}
