import { DataSource } from 'typeorm';

export const returnInput = {
  purchaseItemId: 30, quantity: 1, returnDate: '2026-11-14', reason: 'Piezas faltantes en el producto',
};

export async function createReturnCase(db: DataSource, status = 'Aprobado', purchaseItemId = 30) {
  const [row] = await db.query(`INSERT INTO reclamo(id_venta,id_cliente,motivo,estado)
    VALUES (10,20,'Caso ficticio para devolución',$1) RETURNING id_reclamo`, [status]);
  const id = row.id_reclamo as number;
  await db.query('INSERT INTO postventa_registro_producto(id_reclamo,id_detalle_ped) VALUES ($1,$2)',
    [id, purchaseItemId]);
  return id;
}
