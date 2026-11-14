import { DataSource } from 'typeorm';
import { ReturnsService } from '../../src/returns/returns.service';
import { returnInput } from './return-fixture';

describe('HU-06: errores de conexión seguros', () => {
  const failure = new Error('Credenciales y SQL privados');
  const db = { manager: { exists: jest.fn().mockRejectedValue(failure) },
    transaction: jest.fn().mockRejectedValue(failure) } as unknown as DataSource;
  const service = new ReturnsService(db);

  it.each(['consulta', 'registro'])('oculta detalles internos ante fallo de %s', async operation => {
    const action = operation === 'consulta' ? service.findForCase(1) : service.create(1, returnInput);
    await expect(action).rejects.toMatchObject({ status: 503,
      message: 'No fue posible acceder a las devoluciones. Inténtalo nuevamente más tarde.' });
  });
});
