---
name: Instrucciones de backend
description: Convenciones para NestJS, TypeScript, PostgreSQL y TypeORM.
applyTo: "backend/**/*.ts"
---

# Backend: NestJS, TypeScript, PostgreSQL y TypeORM

- Sigue la estructura modular y las convenciones existentes de NestJS.
- Separa controllers, services/providers, DTOs y entidades según sus responsabilidades.
- Valida entradas en el servidor con los mecanismos ya instalados.
- Usa códigos HTTP apropiados y errores consistentes.
- Lee la configuración sensible desde variables de entorno y valida la configuración requerida.
- Restringe CORS a los orígenes necesarios.
- Define entidades, relaciones, restricciones e índices según el dominio.
- Utiliza migraciones versionadas para cambios de esquema compartidos o de producción.
- No uses `synchronize: true` en producción.
- Evita SQL inseguro, concatenación de entradas no confiables y consultas N+1.
- Usa transacciones cuando una operación requiera consistencia entre varios cambios.
- No expongas secretos, stack traces ni detalles internos en respuestas de producción.
- Añade o actualiza pruebas Jest para servicios, controladores y validaciones relevantes.
- No ejecutes migraciones destructivas ni borres datos sin autorización.

Nota: ajusta `applyTo` si el backend no se encuentra dentro de la carpeta `backend/`. Por ejemplo, para un backend en `server/`, usa `server/**/*.ts`.
