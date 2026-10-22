# Instrucciones generales del repositorio

## Stack del proyecto

- Frontend: React + TypeScript + Vite.
- Estilos: Tailwind CSS.
- Backend: NestJS + TypeScript.
- Base de datos: PostgreSQL.
- ORM: TypeORM.
- Pruebas: Jest.
- Calidad estática: ESLint.

Respeta las versiones, los scripts y el gestor de paquetes que ya existan en el repositorio. No asumas que una dependencia está instalada sin revisar la configuración.

## Principios generales

- Inspecciona la estructura, README, archivos de configuración y patrones existentes antes de editar.
- No cambies el stack, agregues dependencias ni hagas refactorizaciones amplias sin justificar la necesidad.
- Mantén TypeScript tipado y evita `any` cuando sea posible.
- Reutiliza código existente y modifica solo los archivos necesarios.
- No inventes endpoints, contratos de API, datos de prueba ni resultados de ejecución.
- No afirmes que ejecutaste pruebas o compilaciones si no lo hiciste.
- Responde en español salvo que el usuario solicite otro idioma.

## Frontend

- Utiliza componentes funcionales y hooks de React.
- Mantén la interfaz responsive, semántica y accesible.
- Gestiona estados de carga, error y ausencia de datos.
- Usa Tailwind CSS de acuerdo con la versión instalada.
- Mantén la comunicación HTTP organizada y alineada con los contratos reales del backend.
- Trata todas las variables `VITE_*` como públicas; nunca incluyas secretos en el frontend.

## Backend

- Sigue los módulos y convenciones de NestJS existentes.
- Separa controllers, services/providers, DTOs y entidades.
- Valida los datos recibidos en el servidor.
- Utiliza códigos HTTP y errores consistentes.
- Lee configuración desde variables de entorno.
- Restringe CORS a los orígenes necesarios y conserva los controles de seguridad existentes.

## PostgreSQL y TypeORM

- Usa entidades y relaciones adecuadas al dominio.
- Usa migraciones versionadas para cambios de esquema compartidos o de producción.
- No habilites `synchronize: true` en producción.
- No ejecutes operaciones destructivas ni migraciones que puedan borrar datos sin autorización.
- Evita SQL inseguro y consultas N+1.
- Nunca guardes credenciales en el repositorio.

## Pruebas y validación

- Añade o actualiza pruebas Jest para cambios relevantes.
- Ejecuta los scripts existentes de lint, test, typecheck y build cuando proceda.
- Revisa los scripts reales de `package.json` antes de ejecutar comandos.
- Corrige fallos introducidos por los cambios y comunica los fallos preexistentes que detectes.
- Si una verificación no puede ejecutarse, indica la razón.

## Seguridad y cambios de riesgo

- No reveles secretos ni valores de archivos `.env`.
- No borres datos ni ejecutes comandos destructivos sin permiso explícito.
- No debilites autenticación, autorización, validaciones o pruebas para ocultar errores.
- Explica el impacto de nuevas dependencias, migraciones, variables de entorno y cambios en contratos API.

## Entrega

Al terminar, informa qué cambió, qué archivos fueron afectados, qué comprobaciones se ejecutaron y cuáles son los resultados, además de cualquier configuración o tarea pendiente.
