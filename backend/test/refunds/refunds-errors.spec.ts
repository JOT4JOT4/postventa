import { DataSource } from 'typeorm';
import { RefundsService } from '../../src/refunds/refunds.service';

describe('HU-10: errores seguros de persistencia', () => {
  it('no expone el error de una transacción fallida', async () => {
    const db = { transaction: jest.fn().mockRejectedValue(new Error('detalle SQL privado')) };
    const service = new RefundsService(db as unknown as DataSource);
    await expect(service.create(1, { amount: '10' })).rejects.toMatchObject({ status: 503 });
    await expect(service.create(1, { amount: '10' })).rejects.not.toThrow('SQL privado');
  });

  it('no presenta un fallo de conexión como lista vacía', async () => {
    const db = { manager: { exists: jest.fn().mockRejectedValue(new Error('detalle privado')) } };
    const service = new RefundsService(db as unknown as DataSource);
    await expect(service.findForCase(1)).rejects.toMatchObject({ status: 503 });
  });
});
