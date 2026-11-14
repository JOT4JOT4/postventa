import { databaseOptions } from '../../src/database/database-options';

const environment = {
  DATABASE_HOST: 'localhost', DATABASE_NAME: 'postventa',
  DATABASE_USER: 'postventa', DATABASE_PASSWORD: 'contraseña-ficticia-de-prueba',
};

function options(changes: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = { ...environment, ...changes };
  return databaseOptions(name => values[name]);
}

describe('Configuración PostgreSQL compartida por aplicación y migraciones', () => {
  it.each(['localhost', '127.0.0.1', '::1', 'database'])('permite PostgreSQL local sin SSL: %s', host => {
    expect(options({ DATABASE_HOST: host })).toMatchObject({ ssl: false, port: 5432, synchronize: false });
  });

  it('verifica el certificado por defecto en destinos remotos', () => {
    expect(options({ DATABASE_HOST: 'servidor-ficticio.example' }).ssl).toEqual({ rejectUnauthorized: true });
  });

  it('respeta una selección explícita y válida de SSL', () => {
    expect(options({ DATABASE_SSL: 'true' }).ssl).toEqual({ rejectUnauthorized: true });
    expect(options({ DATABASE_SSL: 'false' }).ssl).toBe(false);
  });

  it.each(['DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD'])('rechaza ausencia de %s', name => {
    expect(() => options({ [name]: '' })).toThrow(name);
  });

  it.each(['abc', '0', '65536', '1.5', ''])('rechaza puerto inválido: %s', port => {
    expect(() => options({ DATABASE_PORT: port })).toThrow('DATABASE_PORT');
  });

  it('rechaza SSL ambiguo sin mostrar valores privados', () => {
    expect(() => options({ DATABASE_SSL: 'valor-privado' })).toThrow('DATABASE_SSL debe ser true o false.');
  });
});
