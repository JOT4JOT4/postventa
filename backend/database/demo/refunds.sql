-- Casos y solicitudes exclusivamente ficticios para demostrar HU-10.
CREATE TEMP TABLE nuevos_casos_reembolso (id integer PRIMARY KEY) ON COMMIT DROP;
WITH nuevos AS (
  INSERT INTO reclamo(id_reclamo,id_venta,id_cliente,motivo,estado)
  SELECT 200000+n, 9+n, p.id_cliente, 'Solicitud ficticia de reembolso #' || n, 'Aprobado'
  FROM generate_series(1,10) n JOIN venta v ON v.id_venta=9+n
  JOIN pedido p ON p.id_pedido=v.id_pedido
  ON CONFLICT (id_reclamo) DO NOTHING RETURNING id_reclamo
)
INSERT INTO nuevos_casos_reembolso SELECT id_reclamo FROM nuevos;

INSERT INTO postventa_registro(id_reclamo,tipo,fecha_registro)
SELECT id, 'Reembolso', CURRENT_TIMESTAMP - interval '2 days' FROM nuevos_casos_reembolso;

INSERT INTO postventa_registro_producto(id_reclamo,id_detalle_ped)
SELECT n.id, (SELECT min(d.id_detalle_ped) FROM detalle_pedido d
  JOIN venta v ON v.id_pedido=d.id_pedido WHERE v.id_venta=r.id_venta)
FROM nuevos_casos_reembolso n JOIN reclamo r ON r.id_reclamo=n.id;

INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
SELECT id, NULL, 'Abierto', 'Registro ficticio para HU-10', CURRENT_TIMESTAMP - interval '2 days'
FROM nuevos_casos_reembolso;
INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
SELECT id, 'Abierto', 'En revisión', 'Revisión ficticia para HU-10', CURRENT_TIMESTAMP - interval '1 day'
FROM nuevos_casos_reembolso;
INSERT INTO postventa_historial(id_reclamo,estado_anterior,estado_nuevo,nota,fecha_cambio)
SELECT id, 'En revisión', 'Aprobado', 'Aprobación ficticia para HU-10', CURRENT_TIMESTAMP
FROM nuevos_casos_reembolso;

INSERT INTO reembolso(id_reclamo,monto_reembolsado)
SELECT id, (id-200000)*1000.00 FROM nuevos_casos_reembolso;

SELECT setval(pg_get_serial_sequence('reclamo','id_reclamo'),
  greatest((SELECT coalesce(max(id_reclamo),1) FROM reclamo),
    nextval(pg_get_serial_sequence('reclamo','id_reclamo'))));
