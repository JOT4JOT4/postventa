# Cabecera del módulo

`ModuleHeader.tsx` exporta `ModuleHeader({activeSection})`. Recibe `registration`, `cases` o `null` y devuelve la cabecera LesGo con la identificación ERP · POSTVENTA, navegación y enlace para saltar al contenido. Marca la sección actual con `aria-current`; las rutas siguen siendo `#/` y `#/casos`.

El enlace Saltar al contenido intercepta el clic y enfoca `#main-content`, sin cambiar el hash ni activar una ruta inexistente. Las vistas deben mantener ese ID y `tabIndex={-1}` en su elemento `main`. No consulta servicios, no administra sesiones y no incorpora enlaces a módulos externos.

`module-header.css` define el logotipo tipográfico, cabecera roja, remate de bloques decorativo, navegación activa, foco y disposición adaptable. Usa los tokens de `../styles/tokens.css`. Debajo de 720 px, organiza marca y navegación en dos filas; el texto auxiliar se oculta debajo de 1000 px.

`App` monta una sola cabecera para registro, listado, detalle, carga, errores y rutas inexistentes. Las vistas conservan sus títulos y contenidos propios. Pruebas de navegación y teclado en `frontend/test/module-header.test.tsx` y `app-navigation.test.tsx`.
