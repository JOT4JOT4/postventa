# Formulario de registro

| Archivo | Componentes y funciones |
| --- | --- |
| `RegistrationForm.tsx` | `RegistrationForm()` muestra compra, selección de tipo y motivo, errores y confirmación con ID y estado. Bloquea el formulario durante operaciones y tras guardar. |
| `PurchaseFields.tsx` | `PurchaseFields(props)` recibe compra, selección y callbacks; muestra cliente de solo lectura y casillas de las líneas compradas. No permite inventar clientes/productos. |
| `use-registration.ts` | `useRegistration()` encapsula estado y acciones. `changePurchase(value)` invalida cliente/productos anteriores; `loadPurchase()` consulta contexto; `toggleItem(id)` selecciona líneas; `submit()` valida y registra. Devuelve estado y funciones para los componentes. Una referencia evita envíos simultáneos. |
| `request-api.ts` | Define tipos internos y cuatro categorías. `findPurchase(id)` obtiene contexto del backend propio. `registerRequest(input)` envía POST y retorna `RegisteredRequest`. `request<T>` maneja HTTP y fallos de red. Usa `VITE_API_BASE_URL`. |
| `registration.css` | Estilos locales basados en el mockup del informe: cabecera azul, acciones granate, formulario claro, foco visible y distribución adaptable. |

El formulario requiere compra verificada, al menos un producto, tipo y motivo.
No solicita el estado ni el cliente al usuario: se asignan/verifican en el backend.
La consulta de compra es exclusivamente el soporte mínimo para completar HU-01.
El identificador ingresado corresponde a `venta.id_venta`; las líneas corresponden
a `detalle_pedido.id_detalle_ped`. El backend obtiene cliente y productos de las
relaciones compartidas. Si las tablas o la BD no están disponibles, muestra un
error 503 y mantiene el registro bloqueado; una venta inexistente produce 404.
No hay datos ficticios, adjuntos, historial, KPIs ni tratamientos de casos en la interfaz.
