# Interfaz de solicitud de reembolso — HU-10

Se integra como una sección del detalle de caso existente, conservando sus estilos y navegación. La consulta se inicia con el botón Consultar reembolso, sin agregar solicitudes automáticas a las otras pantallas.

| Archivo | Responsabilidad, entradas y salidas |
|---|---|
| `refund-api.ts` | Define `Refund` y las funciones `listRefunds(caseId)` y `createRefund(caseId, amount)`. Devuelven promesas de los datos de la API; traducen errores de red/servidor a mensajes visibles en español. Solo envían el monto decimal como texto. |
| `use-refund.ts` | `useRefund(caseId)` administra importe, solicitud guardada, carga, error y acciones `load`/`submit`. Impide envíos simultáneos con una referencia, valida el monto y normaliza coma decimal a punto. Devuelve estado y acciones para la sección. |
| `RefundSection.tsx` | `RefundSection({caseId,status})` devuelve la tarjeta de consulta/registro. Tras consultar, muestra un formulario solo si el caso está Aprobado y no hay solicitud. Una solicitud existente muestra monto, caso, compra, cliente, fecha y estado en solo lectura. El servidor vuelve a validar las reglas. |
| `refund.css` | Estilos de entrada, foco accesible, mensajes y resumen, integrados con las clases de tarjetas del módulo de casos. |

No hay botones para aprobar, ejecutar, pagar ni cambiar el estado del reembolso. Una respuesta de duplicado se muestra y puede actualizarse la consulta. La solicitud existente sigue consultable aunque el caso haya alcanzado otro estado.

La API identifica compra y cliente desde el caso; no existen campos para sobrescribirlos. `CaseManagement` monta esta sección dentro del detalle. Las pruebas de `frontend/test/refunds.test.tsx` cubren registro, consulta, estados, validación, conflictos y reintentos.

Los colores, radios y foco de `refund.css` usan los tokens LesGo. Los botones reutilizan `../styles/controls.css`; se conserva el comportamiento del registro y consulta.
