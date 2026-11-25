import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { parseSchemaName } from './schema-config';

type EnvironmentReader = (name: string) => unknown;

function requiredValue(read: EnvironmentReader, name: string): string {
  const value = read(name);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Falta configurar ${name}.`);
  }
  return value;
}

export function databaseOptions(read: EnvironmentReader): PostgresConnectionOptions {
  const host = requiredValue(read, 'DATABASE_HOST');
  const port = Number(read('DATABASE_PORT') ?? 5432);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DATABASE_PORT debe ser un puerto válido.');
  }
  const local = ['localhost', '127.0.0.1', '::1', 'database'].includes(host);
  const ssl = String(read('DATABASE_SSL') ?? !local);
  if (!['true', 'false'].includes(ssl)) {
    throw new Error('DATABASE_SSL debe ser true o false.');
  }
  const schema = parseSchemaName(read('DATABASE_SCHEMA'), 'DATABASE_SCHEMA');
  return {
    type: 'postgres',
    host,
    port,
    database: requiredValue(read, 'DATABASE_NAME'),
    username: requiredValue(read, 'DATABASE_USER'),
    password: requiredValue(read, 'DATABASE_PASSWORD'),
    ...(schema ? { schema } : {}),
    ssl: ssl === 'true' ? { rejectUnauthorized: true } : false,
    synchronize: false,
  };
}
