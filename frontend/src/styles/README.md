# Identidad visual compartida

Esta carpeta concentra las decisiones visuales de Postventa tomando como referencia el código de E-commerce y Compras: rojo `#e52521`, amarillo `#ffd500`, tipografías Fredoka y Plus Jakarta Sans y superficies claras. Las capturas de referencia aportan el remate rectangular de bloques y los paneles grises redondeados. Los módulos presentan variantes; estos valores no implican un contrato único aprobado para todos ellos.

- `tokens.css`: variables CSS globales de paleta, superficies, texto, bordes, foco, radios, sombras y tipografía. No contiene lógica ni llamadas externas. Las hojas de registro, casos, devoluciones y reembolsos las consumen para mantener coherencia.
- `controls.css`: estilos comunes de botones primarios/secundarios, estados deshabilitados, foco visible, enlaces de casos y página inexistente. Incluye reducción de movimiento según la preferencia del sistema. Se limita a los controles de Postventa para evitar cambios en la navegación de la cabecera.

`../index.css` importa ambos archivos antes de las directivas de Tailwind, establece el modo claro y la estructura de la aplicación. Cada carpeta funcional conserva las reglas específicas de disposición y componentes.

Las fuentes se cargan desde Google Fonts mediante `frontend/index.html`, siguiendo E-commerce y Compras. Su descarga requiere conexión; si no está disponible se usa la cadena de fuentes del sistema y los formularios continúan funcionando. Ninguna fuente necesita credenciales. La marca es texto, y el remate es decorativo mediante CSS, sin imágenes o scripts externos adicionales.

Para ajustar la identidad, cambiar los tokens y revisar registro, listado, detalle, devoluciones, reembolsos y estados de error en escritorio y móvil. El estilo no modifica permisos, validaciones de negocio, rutas ni contratos de API.
