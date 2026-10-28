import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillInitialHistory1793088000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`INSERT INTO postventa_historial
      (id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
      SELECT r.id_reclamo, NULL,
        CASE WHEN m.id_reclamo IS NOT NULL THEN 'Abierto' ELSE r.estado END,
        CASE WHEN m.id_reclamo IS NOT NULL THEN 'Registro inicial recuperado de la fecha de solicitud'
          ELSE 'Estado conocido al recuperar historial; fecha inicial no disponible' END,
        coalesce(m.fecha_registro, CURRENT_TIMESTAMP)
      FROM reclamo r LEFT JOIN postventa_registro m USING (id_reclamo)
      WHERE NOT EXISTS (SELECT 1 FROM postventa_historial h
        WHERE h.id_reclamo=r.id_reclamo AND h.estado_anterior IS NULL)`);
  }

  async down(): Promise<void> {
    throw new Error('La recuperación de historial no se revierte automáticamente para preservar la trazabilidad.');
  }
}
