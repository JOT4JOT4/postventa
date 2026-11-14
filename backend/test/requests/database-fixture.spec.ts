import { openTestDatabase } from './database-fixture';

describe('Destino protegido de las pruebas de persistencia', () => {
  const original = process.env.POSTVENTA_TEST_DATABASE_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.POSTVENTA_TEST_DATABASE_URL;
    else process.env.POSTVENTA_TEST_DATABASE_URL = original;
  });

  it('rechaza un destino remoto aunque la base termine en _test', async () => {
    process.env.POSTVENTA_TEST_DATABASE_URL = 'postgresql://prueba@servidor-ficticio.example/erp_test';
    await expect(openTestDatabase('protected')).rejects.toThrow('local y aislado');
  });

  it('rechaza una base local que no sea exclusiva de pruebas', async () => {
    process.env.POSTVENTA_TEST_DATABASE_URL = 'postgresql://prueba@localhost/erp';
    await expect(openTestDatabase('protected')).rejects.toThrow('termine en _test');
  });
});
