const SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/;

export function parseSchemaName(value: unknown, envName: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !SCHEMA_NAME.test(value.trim())) {
    throw new Error(`${envName} debe ser un identificador PostgreSQL válido en minúsculas.`);
  }
  return value.trim();
}

export function qualifyTable(table: string, schema?: string): string {
  return schema ? `${schema}.${table}` : table;
}
