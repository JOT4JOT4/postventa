# Interfaz de devoluciones — HU-06

Se monta desde el detalle de casos existente. La consulta es explícita con Consultar devolución, sin agregar llamadas automáticas al abrir otras pantallas.

| Archivo | Componentes o funciones, entradas y resultados |
|---|---|
| `return-api.ts` | Define `ProductReturn`, `ReturnProduct`, `ReturnInput` y `ReturnData`. `getReturns(caseId)` consulta antecedentes y productos; `createReturn(caseId, input)` envía línea, cantidad, fecha y motivo. Retornan promesas de datos y presentan errores de red/servidor en español. |
| `return-validation.ts` | `isReturnDate(value)` devuelve si el texto representa una fecha calendario válida AAAA-MM-DD, incluidos años bisiestos; `today()` devuelve el día local para el valor inicial. No establece políticas de plazos. |
| `use-return.ts` | `useReturn(caseId)` devuelve datos, campos, setters, carga, error y acciones `load`/`submit`. Valida selección, cantidad, fecha y motivo, recorta el motivo y evita envíos simultáneos mediante referencia. Depende del cliente HTTP y de la validación de fechas. |
| `ReturnForm.tsx` | `ReturnForm({form})` recibe el estado del hook y devuelve campos accesibles de producto, cantidad, fecha y motivo. Muestra unidades compradas/restantes y deshabilita productos agotados. El envío llama a `submit`. |
| `ReturnSection.tsx` | `ReturnSection({caseId,status})` consulta y presenta el registro guardado, sus referencias y motivo. Solo ofrece registrar si está Aprobado, no hay devolución y hay unidades. Una devolución existente sigue visible en otros estados. |
| `return.css` | Estilos propios de tarjeta, botones, campos, foco, grilla adaptable y motivo. Reutiliza clases generales del detalle sin modificar otras pantallas. |

El backend vuelve a validar las reglas y deriva cliente, compra y producto. El navegador no decide esos vínculos. El registro no modifica el estado del caso ni acredita recepción en bodega o actualización de stock.

Pruebas en `frontend/test/returns.test.tsx` y `return-validation.test.ts`. Los errores por registro concurrente permiten Actualizar devolución y recuperar lo persistido.
