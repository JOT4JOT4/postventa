import { EntityManager } from 'typeorm';

export interface ReturnRecord {
  id: number; caseId: number; purchaseId: number; customerId: number;
  purchaseItemId: number; productId: number; productName: string;
  quantity: number; returnDate: string; reason: string;
}

export interface ReturnProduct {
  purchaseItemId: number; productId: number; productName: string;
  purchasedQuantity: number; availableQuantity: number;
}

export function readReturns(manager: EntityManager, caseId: number): Promise<ReturnRecord[]> {
  return manager.query(`SELECT d.id_devolucion AS id, d.id_reclamo AS "caseId",
    r.id_venta AS "purchaseId", r.id_cliente AS "customerId",
    d.id_detalle_ped AS "purchaseItemId", d.id_producto AS "productId",
    pr.nombre_set AS "productName", d.cantidad AS quantity,
    to_char(d.fecha_devolucion, 'YYYY-MM-DD') AS "returnDate", d.motivo AS reason
    FROM devolucion d JOIN reclamo r ON r.id_reclamo=d.id_reclamo
    JOIN inv_producto pr ON pr.id_producto=d.id_producto
    WHERE d.id_reclamo=$1 ORDER BY d.id_devolucion`, [caseId]);
}

export function readReturnProducts(manager: EntityManager, caseId: number): Promise<ReturnProduct[]> {
  return manager.query(`SELECT d.id_detalle_ped AS "purchaseItemId",
    d.id_producto AS "productId", pr.nombre_set AS "productName",
    d.cantidad AS "purchasedQuantity",
    greatest(d.cantidad-coalesce((SELECT sum(rt.cantidad) FROM devolucion rt
      WHERE rt.id_detalle_ped=d.id_detalle_ped),0),0)::integer AS "availableQuantity"
    FROM reclamo r JOIN venta v ON v.id_venta=r.id_venta
    JOIN pedido p ON p.id_pedido=v.id_pedido AND p.id_cliente=r.id_cliente
    JOIN detalle_pedido d ON d.id_pedido=v.id_pedido
    JOIN postventa_registro_producto rp ON rp.id_reclamo=r.id_reclamo AND rp.id_detalle_ped=d.id_detalle_ped
    JOIN inv_producto pr ON pr.id_producto=d.id_producto
    WHERE r.id_reclamo=$1 ORDER BY d.id_detalle_ped`, [caseId]);
}
