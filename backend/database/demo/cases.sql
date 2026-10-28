-- Datos exclusivamente ficticios. Solo se procesan casos insertados en esta ejecución.
CREATE TEMP TABLE nuevos_casos_demo (id integer PRIMARY KEY, posicion integer) ON COMMIT DROP;
WITH nuevos AS (
  INSERT INTO reclamo(id_reclamo, id_venta, id_cliente, motivo, descripcion, estado)
  SELECT 100000 + n, 9 + ((n - 1) % 10) + 1, (SELECT p.id_cliente FROM pedido p JOIN venta v ON v.id_pedido = p.id_pedido
      WHERE v.id_venta = 10 + ((n - 1) % 10)),
    'Caso ficticio Sprint 2 #' || n, 'Descripción ficticia del problema reportado #' || n,
    CASE WHEN n <= 10 THEN 'Cerrado'
      ELSE (ARRAY['Abierto','En revisión','Aprobado','Rechazado'])[((n - 11) % 4) + 1] END
  FROM generate_series(1,20) AS n
  ON CONFLICT (id_reclamo) DO NOTHING RETURNING id_reclamo
)
INSERT INTO nuevos_casos_demo SELECT id_reclamo, id_reclamo - 100000 FROM nuevos;

INSERT INTO postventa_registro(id_reclamo, tipo, fecha_registro)
SELECT id, (ARRAY['Reclamo','Cambio','Devolución','Reembolso'])[((posicion - 1) % 4) + 1],
  CURRENT_TIMESTAMP - interval '2 days' FROM nuevos_casos_demo;

INSERT INTO postventa_registro_producto(id_reclamo, id_detalle_ped)
SELECT d.id, (SELECT min(dp.id_detalle_ped) FROM detalle_pedido dp
  JOIN venta v ON v.id_pedido = dp.id_pedido WHERE v.id_venta = r.id_venta)
FROM nuevos_casos_demo d JOIN reclamo r ON r.id_reclamo = d.id;

INSERT INTO postventa_historial(id_reclamo, estado_anterior, estado_nuevo, nota, fecha_cambio)
SELECT id, NULL, 'Abierto', 'Registro inicial ficticio para demostración',
  CURRENT_TIMESTAMP - interval '2 days' FROM nuevos_casos_demo;

INSERT INTO postventa_historial(id_reclamo, estado_anterior, estado_nuevo, nota, fecha_cambio)
SELECT d.id, 'Abierto', 'En revisión', 'Evaluación ficticia de antecedentes',
  CURRENT_TIMESTAMP - interval '1 day'
FROM nuevos_casos_demo d JOIN reclamo r ON r.id_reclamo = d.id
WHERE r.estado IN ('En revisión','Aprobado','Cerrado');

INSERT INTO postventa_historial(id_reclamo, estado_anterior, estado_nuevo, nota, fecha_cambio)
SELECT d.id, CASE WHEN r.estado = 'Rechazado' THEN 'Abierto' ELSE 'En revisión' END,
  r.estado, CASE WHEN r.estado = 'Rechazado' THEN 'Rechazo ficticio: antecedentes no justifican la solicitud.'
    WHEN r.estado = 'Aprobado' THEN 'Solicitud aprobada en evaluación ficticia.'
    ELSE 'Atención ficticia concluida.' END, CURRENT_TIMESTAMP
FROM nuevos_casos_demo d JOIN reclamo r ON r.id_reclamo = d.id
WHERE r.estado IN ('Aprobado','Cerrado','Rechazado');

INSERT INTO postventa_resolucion(id_reclamo, resolucion, fecha_resolucion)
SELECT id, 'Resolución ficticia: se aclaró el problema informado y se comunicó el resultado al cliente.',
  CURRENT_TIMESTAMP FROM nuevos_casos_demo WHERE posicion <= 10;

-- Conservar el mayor valor alcanzado por las secuencias, incluso tras eliminaciones previas.
SELECT setval(pg_get_serial_sequence('reclamo','id_reclamo'),
  greatest((SELECT coalesce(max(id_reclamo),1) FROM reclamo),
    nextval(pg_get_serial_sequence('reclamo','id_reclamo'))));
