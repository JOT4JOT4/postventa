import { DataSource } from 'typeorm';
import { CasesService } from '../../src/cases/cases.service';
import { CaseHistoryEntity } from '../../src/cases/case-history.entity';
import { CaseResolutionEntity } from '../../src/cases/case-resolution.entity';
import { CaseStatus } from '../../src/cases/case.types';
import { RequestEntity } from '../../src/requests/request.entity';
import { databaseSuite, openTestDatabase, closeTestDatabase } from '../requests/database-fixture';
import { createSharedFixture } from '../requests/shared-schema.fixture';
import { validInput } from '../requests/fixtures';

databaseSuite('HU-04: persistencia PostgreSQL de gestión de reclamos', () => {
  let db: DataSource;
  let service: CasesService;
  let caseId: number;

  beforeAll(async () => {
    db = await openTestDatabase('hu04_data');
    await createSharedFixture(db);
    await db.runMigrations();
    service = new CasesService(db);

    // Crear un reclamo base
    const result = await db.query(`
      INSERT INTO reclamo(id_venta, id_cliente, motivo, estado)
      VALUES (10, 20, $1, 'Abierto') RETURNING id_reclamo
    `, [validInput.reason]);
    caseId = result[0].id_reclamo;
    await db.query(`INSERT INTO postventa_registro(id_reclamo, tipo) VALUES ($1, $2)`, [caseId, validInput.type]);
    await db.query(`INSERT INTO postventa_registro_producto(id_reclamo, id_detalle_ped) VALUES ($1, 30)`, [caseId]);
    await db.query(`INSERT INTO postventa_historial(id_reclamo, estado_anterior, estado_nuevo, nota)
      VALUES ($1, NULL, 'Abierto', 'Registro de prueba HU-04')`, [caseId]);
  });

  afterAll(async () => closeTestDatabase(db));

  it('findById devuelve el caso con todos sus campos', async () => {
    const detail = await service.findById(caseId);
    expect(detail.status).toBe('Abierto');
    expect(detail.type).toBe('Reclamo');
    expect(detail.items).toContain(30);
    expect(detail.resolution).toBeNull();
  });

  it('findById lanza 404 para un caso inexistente', async () => {
    await expect(service.findById(2147483647)).rejects.toMatchObject({ status: 404 });
  });

  it('updateStatus cambia el estado y registra el historial', async () => {
    await service.updateStatus(caseId, { status: CaseStatus.InReview, note: 'Revisando el pedido.' });
    const caseRow = await db.getRepository(RequestEntity).findOneByOrFail({ id: caseId });
    expect(caseRow.status).toBe('En revisión');

    const history = await db.getRepository(CaseHistoryEntity).findBy({ caseId });
    expect(history.length).toBeGreaterThanOrEqual(2); // inicial + cambio
    const last = history[history.length - 1];
    expect(last.previousStatus).toBe('Abierto');
    expect(last.newStatus).toBe('En revisión');
    expect(last.note).toBe('Revisando el pedido.');
  });

  it('updateStatus actualiza la descripción sin añadir historial si el estado no cambia', async () => {
    const before = await db.getRepository(CaseHistoryEntity).countBy({ caseId });
    await service.updateStatus(caseId, { status: CaseStatus.InReview, description: 'Producto llegó roto.' });
    const after = await db.getRepository(CaseHistoryEntity).countBy({ caseId });
    expect(after).toBe(before);
    const caseRow = await db.getRepository(RequestEntity).findOneByOrFail({ id: caseId });
    expect(caseRow.description).toBe('Producto llegó roto.');
  });

  it('updateStatus rechaza una transición no permitida', async () => {
    // 'En revisión' → 'Abierto' no está permitido
    await expect(service.updateStatus(caseId, { status: CaseStatus.Open }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('registra la resolución y verifica unicidad', async () => {
    // Llevar el caso a estado terminal primero
    await service.updateStatus(caseId, { status: CaseStatus.Closed });

    const res = await service.resolve(caseId, { resolution: 'Se envió un reemplazo al cliente.' });
    expect(res.resolution).toBe('Se envió un reemplazo al cliente.');

    const stored = await db.getRepository(CaseResolutionEntity).findOneByOrFail({ caseId });
    expect(stored.resolution).toBe('Se envió un reemplazo al cliente.');

    // Segunda resolución debe lanzar 409
    await expect(service.resolve(caseId, { resolution: 'Duplicado.' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('resolve lanza 400 si el caso no está en estado terminal', async () => {
    const result2 = await db.query(`
      INSERT INTO reclamo(id_venta, id_cliente, motivo, estado)
      VALUES (10, 20, 'Otro caso ficticio', 'Abierto') RETURNING id_reclamo
    `);
    const id2 = result2[0].id_reclamo;
    await expect(service.resolve(id2, { resolution: 'Resolución prematura.' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('getHistory devuelve entradas ordenadas cronológicamente', async () => {
    const history = await service.getHistory(caseId);
    expect(history.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < history.length; i++) {
      expect(new Date(history[i].changedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(history[i - 1].changedAt).getTime(),
      );
    }
  });

  it('getHistory lanza 404 para un caso inexistente', async () => {
    await expect(service.getHistory(2147483647)).rejects.toMatchObject({ status: 404 });
  });
});
