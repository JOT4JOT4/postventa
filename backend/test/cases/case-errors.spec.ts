import { DataSource } from 'typeorm';
import { CasesService } from '../../src/cases/cases.service';

describe('Errores de lectura del historial', () => {
  it('convierte un rechazo asíncrono de la base en 503 sin detalles privados', async () => {
    const builder = {
      where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(), getMany: jest.fn().mockRejectedValue(new Error('SQL privado')),
    };
    const db = { manager: { exists: jest.fn().mockResolvedValue(true), createQueryBuilder: () => builder } };
    const service = new CasesService(db as unknown as DataSource);
    await expect(service.getHistory(1)).rejects.toMatchObject({ status: 503 });
    await expect(service.getHistory(1)).rejects.not.toThrow('SQL privado');
  });
});
