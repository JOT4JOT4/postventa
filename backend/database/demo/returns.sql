-- Casos exclusivamente ficticios para demostrar el registro de devoluciones HU-06.
CREATE TEMP TABLE nuevos_casos_devolucion (id integer PRIMARY KEY) ON COMMIT DROP;
WITH nuevos AS (
  INSERT INTO reclamo(id_reclamo,id_venta,id_cliente,motivo,estado)
  SELECT 300000+n, 9+n, p.id_cliente, 'Solicitud ficticia de devolución #' || n, 'Aprobado'
  FROM generate_series(1,10) n JOIN venta v ON v.id_venta=9+n
  JOIN pedido p ON p.id_pedido=v.id_pedido
  ON CONFLICT (id_reclamo) DO NOTHING RETURNING id_reclamo
)
INSERT INTO nuevos_casos_devolucion SELECT id_reclamo FROM nuevos;

INSERT INTO postventa_registro(id_reclamo,tipo,fecha_registro)
SELECT id, 'Devolución', CURRENT_TIMESTAMP - interval '2 days' FROM nuevos_casos_devolucion;
INSERT INTO postventa_registro_producto(id_reclamo,id_detalle_ped)
SELECT n.id, (SELECT min(d.id_detalle_ped) FROM detalle_pedido d
  JOIN venta v ON v.id_pedido=d.id_pedido WHERE v.id_venta=r.id_venta)
FROM nuevos_casos_devolucion n JOIN reclamo r ON r.id_reclamo=n.id;

INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
SELECT id, NULL, 'Abierto', 'Registro ficticio para HU-06', CURRENT_TIMESTAMP - interval '2 days'
FROM nuevos_casos_devolucion;
INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
SELECT id, 'Abierto', 'En revisión', 'Revisión ficticia para HU-06', CURRENT_TIMESTAMP - interval '1 day'
FROM nuevos_casos_devolucion;
INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
SELECT id, 'En revisión', 'Aprobado', 'Aprobación ficticia para HU-06', CURRENT_TIMESTAMP
FROM nuevos_casos_devolucion;

INSERT INTO devolucion(id_reclamo,id_detalle_ped,id_producto,cantidad,fecha_devolucion,motivo)
SELECT n.id, d.id_detalle_ped, d.id_producto, 1, CURRENT_DATE, 'Producto ficticio con piezas faltantes'
FROM nuevos_casos_devolucion n JOIN postventa_registro_producto rp ON rp.id_reclamo=n.id
JOIN detalle_pedido d ON d.id_detalle_ped=rp.id_detalle_ped;

SELECT setval(pg_get_serial_sequence('reclamo','id_reclamo'),
  greatest((SELECT coalesce(max(id_reclamo),1) FROM reclamo),
    nextval(pg_get_serial_sequence('reclamo','id_reclamo'))));
