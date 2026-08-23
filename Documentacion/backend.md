# Backend Gestion Salud - Documentacion tecnica

## 1. Objetivo y alcance
El backend implementa la API de Gestion Salud para administrar pacientes, usuarios, historiales clinicos y recordatorios. Se construyo con NestJS 11, TypeORM y SQL Server, exponiendo todos los servicios REST bajo el prefijo `/api/v1`. Este documento resume la configuracion, arquitectura, modulos y contratos disponibles.

## 2. Stack y dependencias clave
- Runtime: Node.js LTS (recomendado 20.x) con TypeScript 6 (`tsconfig.json`).
- Framework: NestJS (@nestjs/* 11.x) con TypeORM 0.3 y SQL Server (`mssql`).
- Seguridad: JWT (`@nestjs/jwt`), Passport, bcryptjs, revocacion de tokens y guard global.
- Validacion: `nestjs-zod` + `zod` para transformar DTOs y mensajes consistentes.
- Observabilidad: morgan para trazas HTTP, filtro global `ApiExceptionFilter` y logs de version.
- Utilitarios: `chrono-node` para interpretar lenguaje natural en recordatorios, Nodemailer para correo SMTP, `nestjs/config` y `dotenv` para variables de entorno.

## 3. Estructura del proyecto
```
Backend/
├─ src/
│  ├─ app.module.ts           -> orquestador Nest
│  ├─ main.ts                 -> arranque, CORS, versionado y logs
│  ├─ auth/                   -> login, JWT, permisos, reset de contrasena
│  ├─ users/                  -> servicio especializado para tabla usuario
│  ├─ modules/                -> CRUD autogenerados por tabla (paciente, vacuna, etc.)
│  ├─ database/               -> gateway SQL generico hacia tablas permitidas
│  ├─ notifications/          -> interpretacion de lenguaje natural para notificaciones
│  ├─ mail/                   -> adaptador SMTP
│  ├─ common/                 -> filtros y esquemas compartidos
│  └─ version/                -> endpoint de version y metadata de build
├─ scripts/generate-modules.js -> regenerar modulos CRUD desde SQL Server
├─ dist/                      -> salida compilada (`npm run build`)
├─ package.json / package-lock.json
└─ .env.example               -> referencia de configuracion
```

## 4. Scripts npm (`Backend/package.json`)
| Script | Descripcion |
| --- | --- |
| `npm install` | Instala dependencias (Node 20 recomendado).
| `npm run start:dev` | Ejecuta Nest con `ts-node-dev`, recarga en caliente (`src/main.ts`).
| `npm run build` | Compila a JavaScript en `dist/`.
| `npm start` | Ejecuta la version compilada `dist/main.js`.
| `npm run start:debug` | Igual que start:dev pero expone el inspector.
| `npm run generate:modules` | Recorre las tablas listadas en `scripts/generate-modules.js` y reconstruye entidades, DTOs y servicios bajo `src/modules/`.

## 5. Configuracion y variables de entorno
Usa `@nestjs/config` globalmente (`AppModule`). Carga la configuracion desde `.env`; revisa `Backend/.env.example` como plantilla. Variables adicionales usadas en el codigo:

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `PORT` | No (3000) | Puerto HTTP expuesto; siempre agrega `/api/v1` al consumir endpoints (`src/main.ts`). |
| `DB_HOST`, `DB_PORT` | Si | Host y puerto de SQL Server. |
| `DB_NAME` | Si | Base de datos que contiene las tablas clinicas. |
| `DB_AUTH` | No (`sql`) | `sql` usa usuario/clave. `windows` habilita NTLM (`app.module.ts`). |
| `DB_USER`, `DB_PASSWORD` | Si (modo sql) | Credenciales SQL. `DB_PASSWORD` puede omitirse si se usa autenticacion integrada. |
| `DB_DOMAIN` | Requerido solo en `DB_AUTH=windows` | Dominio NTLM para `userName`. |
| `DB_CONNECTION_TIMEOUT_MS` | No (`60000` Azure SQL, `15000` resto) | Tiempo maximo para abrir una conexion TCP con SQL Server. Sube este valor en Render si Azure SQL tarda en responder o reactivarse. |
| `DB_REQUEST_TIMEOUT_MS` | No (`60000` Azure SQL, `15000` resto) | Tiempo maximo para ejecutar una solicitud SQL antes de abortarla. |
| `DB_RETRY_ATTEMPTS` | No (`5` Azure SQL, `2` resto) | Reintentos de inicializacion de TypeORM cuando la base tarda en estar disponible. |
| `DB_RETRY_DELAY_MS` | No (`5000`) | Espera entre reintentos de inicializacion de TypeORM. |
| `JWT_SECRET` | Si | Secreto firmado por `@nestjs/jwt`. Guarda al menos 32 caracteres. |
| `JWT_EXPIRES_IN` | No (`1h`) | Expiracion valida para `jsonwebtoken` (ej. `15m`, `2h`, `7d`). |
| `ALLOW_PUBLIC_USER_REGISTRATION` | No (`false`) | Permite registros en `POST /users/register` cuando ya existe al menos un usuario. Si no se define, solo el primer usuario puede crearse publicamente y recibira rol `admin`. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | Opcional | Si faltan, `MailService` sigue funcionando pero solo loguea la falta de SMTP (`src/mail/mail.service.ts`). |
| `NOTIFICATIONS_DEFAULT_TZ` | No (`UTC`) | Zona horaria usada cuando el cliente no envia `timezone` (`src/notifications/notifications.service.ts`). |
| `QR_DEEPLINK_BASE` | No (`gestionsalud://permiso-acceso`) | Esquema usado para generar enlaces profundos en QR de permisos (`permisoacceso.service.ts`). |
| `SHARE_LINK_BASE` | No (`http://localhost:3010/api/v1/permiso-acceso/compartido`) | Base HTTP usada para construir enlaces compartidos que exponen JSON. |
| `SHARE_LINK_SECRET` | No (`JWT_SECRET`) | Secreto HMAC para firmar enlaces compartidos. Si no se define, reutiliza `JWT_SECRET`. |
| `BACKEND_VERSION` / `APP_VERSION` | No | Sobrescriben la version reportada por `VersionService` sin tocar `package.json`. |

**Buenas practicas:**
- No commitear `.env`. Mantener `.env.example` actualizado cuando se agregue una variable nueva.
- Para ambientes Windows con autenticacion integrada, define `DB_AUTH=windows` y elimina `DB_PASSWORD` del archivo.

## 6. Flujo de arranque y middlewares globales
`src/main.ts` crea la aplicacion Nest y aplica configuraciones globales:
1. `morgan` imprime `:method :url :status :res[content-length] - :response-time ms` dentro del prefijo `[http]`).
2. `app.setGlobalPrefix('api')` y `VersioningType.URI` con version por defecto `1`, por lo que todos los endpoints viven en `/api/v1/...`.
3. CORS sin restricciones para permitir al app movil consumir la API.
4. `createZodValidationPipe` convierte cualquier `ZodError` en un `BadRequestException` con mensajes declarativos en espanol.
5. `ApiExceptionFilter` (`src/common/filters/api-exception.filter.ts`) transforma cualquier excepcion en una respuesta JSON consistente:
```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": "los datos enviados no superaron las validaciones",
  "details": { ... },
  "path": "/api/v1/...",
  "timestamp": "2026-04-12T15:35:12.123Z",
  "hint": "corrige los datos indicados ..."
}
```
6. Al finalizar el arranque, escribe en consola `api usuarios <version> escuchando en puerto <port> con prefijo /api - <estado DB>`, usando `VersionService` y `DataSource` para confirmar la conexion.

## 7. Persistencia y acceso a datos
### 7.1 Conexion TypeORM
`AppModule` usa `TypeOrmModule.forRootAsync` con SQL Server, `autoLoadEntities: true` y `synchronize: false` (se espera que la base exista). soporta autenticacion SQL y Windows.

### 7.2 Entidades especializadas
- `src/users/entities/user.entity.ts`: tabla `usuario`, almacena `hashPassword` y `fingerprintHash` como `varbinary`.
- `src/auth/entities/password-reset-token.entity.ts`: tokens de restablecimiento con expiracion y marca `used`.
- `src/auth/entities/revoked-token.entity.ts`: lista negra de JWT (`jwtId`).
- `src/modules/permisoacceso/*.entity.ts`: permisos otorgados a medicos, tokens QR temporales y enlaces compartidos firmados.
- `src/modules/periodo/*`: modulo especializado para calendario menstrual, sintomas, prediccion, historial y reporte medico.
- `src/modules/saludmental/*`: modulo especializado para registro diario, habitos, estadisticas, alertas y reporte medico de salud mental.
- Todas las demas tablas estan bajo `src/modules/<tabla>/<tabla>.entity.ts`, generadas automaticamente y sincronizadas con SQL Server.

### 7.3 Generador de modulos
`scripts/generate-modules.js` consulta `INFORMATION_SCHEMA` para las tablas listadas en `TABLES` y crea:
- Entidad TypeORM con columnas tipadas.
- DTOs `Create`/`Update` basados en `zod`.
- Servicio CRUD con deteccion de llaves compuestas (acepta IDs tipo `valor1,valor2`).
- Controller REST con rutas `POST/GET/GET:id/PATCH:id/DELETE:id`.
- `GestionSaludModule` que re-exporta todos los modulos generados (importado en `AppModule`).
Ejecuta `npm run generate:modules` cada vez que cambie el esquema.

### 7.4 DatabaseModule (passthrough SQL)
`src/database/` expone endpoints genericos para manipular tablas permitidas (`allowedTables` es la misma lista usada por el generador). Puntos clave:
- `GET /api/v1/database/tables` lista las tablas habilitadas.
- `GET /api/v1/database/<tabla>` devuelve todos los registros.
- `GET /api/v1/database/<tabla>/<id>` usa introspeccion de PK para armar el WHERE.
- `POST` y `PATCH` validan que al menos una columna editable exista y devuelven el registro insertado/actualizado gracias a `OUTPUT inserted.*`.
- `DELETE` tambien devuelve error 404 si no encontro filas.
- IDs compuestos se envian como `valor1,valor2`. Las columnas se validan contra metadata real; si la propiedad no existe se responde 400 con `columnasInvalidas`.
Este modulo es util para scripts administrativos o sincronizaciones bulk; manten mas restricciones en la capa de auth antes de exponerlo a clientes finales.

## 8. Seguridad, autenticacion y autorizacion
### 8.1 Guard global y rutas publicas
`AuthModule` registra `JwtAuthGuard` como `APP_GUARD`, por lo que todas las rutas requieren `Authorization: Bearer` salvo las decoradas con `@Public()` (login, alta inicial de usuario, reset de clave). `Public` esta en `src/auth/decorators/public.decorator.ts`.

### 8.2 Login
`POST /api/v1/auth/login` (`src/auth/auth.controller.ts`):
- Acepta `username` + `password` o `fingerprintTemplate` (mutuamente excluyentes, se valida en `LoginDto`).
- Si se envia huella: se requiere `usuario.fingerprintHash`; se calcula `sha256` del base64 (`fingerprintTemplateSchema`) y se compara con `timingSafeEqual`.
- Si se envia clave: se usa `bcrypt.compare` contra `hashPassword`.
- Tras autenticar, `UsersService.registerLogin` guarda `lastLogin` y `AuthService` arma el payload JWT con:
  - `sub`: id usuario.
  - `role`: rol principal (`usuario.role`).
  - `pacienteId`: preferencia en este orden: `usuario.pacienteId`, relacion `UsuarioPaciente.esPrincipal`, primer paciente vinculado.
  - `pacienteIds`: todos los pacientes asociados en `UsuarioPaciente`.
- El token incluye `jti` (id aleatorio) para permitir revocacion.

### 8.3 Logout y revocacion
`POST /api/v1/auth/logout` inserta la combinacion `jwtId + usuarioId + expiresAt` en `revoked_token` (via `TokenRevocationService`). Cada request autenticada pasa por `JwtStrategy.validate`, que llama a `ensureTokenIsActive` para bloquear tokens cerrados.

### 8.4 Reset de contrasena
- `POST /api/v1/auth/forgot-password`: invalida tokens previos y crea un `PasswordResetToken` valido 30 minutos. Responde `{ token, expira }` y, si `MailService` esta configurado, envia correo con el codigo.
- `POST /api/v1/auth/reset-password`: valida token (existe, no usado, no expirado) y actualiza `hashPassword` reutilizando `UsersService.update`.

### 8.5 Acceso a pacientes y permisos avanzados
- `PacienteAccessService` ofrece `canManagePaciente` (admin, superadmin o duenio directo) y `assertAccess` para validar que un medico tenga permiso activo (`permisoacceso`). Usa `PermisoAcceso` y `UsuarioPaciente` como origen de verdad.
- `PermisoAcceso` permite que un paciente (o administrador actuando por el paciente) invite a un medico:
  - `POST /permiso-acceso/paciente/:pacienteId`: crea o reemplaza permisos activos. Tipos: `temporal` (`duracion` 15m/1h/1d) o `permanente`. Guarda `fechaInicio`, `fechaFin` y `estado`.
  - `GET /permiso-acceso/paciente/:pacienteId`: lista y refresca estados (`expirado` si `fechaFin` paso).
  - `GET /permiso-acceso/mios`: medicos ven sus permisos.
  - `PATCH /permiso-acceso/:permisoId`: actualiza tipo, notas o estado (solo actores que controlen al paciente).
  - `DELETE /permiso-acceso/:permisoId`: marca `estado=revocado`.
  - `POST /permiso-acceso/:permisoId/enlace`: genera un enlace firmado con expiracion y lista de `secciones` a compartir. Devuelve `token`, `shareUrl`, `expiresAt` y el alcance seleccionado.
  - `GET /permiso-acceso/compartido/:token`: endpoint publico que valida el enlace y devuelve un JSON con las secciones compartidas mientras el permiso siga activo.
  - `POST /permiso-acceso/:permisoId/qr`: genera un token efimero (1-60 min, default 5) y devuelve `token`, `expiresAt` y `deepLink` (`QR_DEEPLINK_BASE`). Guarda registro en `permisoacceso_token`.
  - `POST /permiso-acceso/qr/claim`: solo medicos. Marca el token como usado y confirma acceso, retornando `permisoId` y `pacienteId`.
  - Secciones soportadas por el enlace: `resumenClinico`, `consultasMedicas`, `saludMental`, `periodo`, `seguimientoFisico`, `seguimientoPostevento`, `examenesClinicos`, `citasMedicas`, `medicaciones`, `vacunas`, `alergias`, `condicionesCronicas`, `antecedentesFamiliares`, `documentosClinicos`, `desparasitaciones`, `embarazos`, `estiloVida`, `evaluacionesHabitos`, `habitosEspecificos`, `lesiones`, `notificaciones`, `operaciones`, `puntajesRiesgo`, `recordatoriosCitas`, `registroDental`, `registrosMenstruales`.
- `UsuarioPaciente` (`src/modules/usuariopaciente`): vincula cuentas a historiales de pacientes.
  - `POST /usuario-paciente`: `actor` puede indicar `usuarioId` (si es admin) o se asume el propio. Evita duplicados.
  - `GET /usuario-paciente/mis-pacientes`: lista relaciones del usuario autenticado.
  - `PATCH /usuario-paciente/:id`, `DELETE /usuario-paciente/:id`: solo admin o duenio.

## 9. APIs principales
Todas las rutas incluyen prefijo `/api/v1`. Las respuestas y validaciones siguen el formato descrito en la seccion 6.

### 9.1 Version y salud
- `GET /version`: devuelve `BackendVersionInfo` (`name`, `description`, `version`, `semver`, `apiVersion`, `buildDate`). Usa `process.env.BACKEND_VERSION` o `package.json`.

### 9.2 Usuarios especializados (`src/users`)
- `GET /users/registration-status` (**publico**): devuelve `{ bootstrapMode, publicRegistrationEnabled, totalUsers }` para que el cliente sepa si el registro abierto esta disponible.
- `POST /users/register` (**publico**): crea usuario con `username`, `password`, `city?`, `country?`, `pacienteId?`, `fingerprintTemplate?`. Si no existe ningun usuario, crea la cuenta inicial con rol `admin`; si ya existen usuarios, solo funciona cuando `ALLOW_PUBLIC_USER_REGISTRATION=true` y asigna rol `paciente`.
- `POST /users` (**admin/superadmin**): crea usuario con `username`, `password`, `city?`, `country?`, `pacienteId?`, `role?`, `activo?`, `fingerprintTemplate?`. Se hashea con bcrypt y se almacena `fingerprintHash` opcional.
- `GET /users`: lista todos los registros.
- `GET /users/:id`: busca por entero.
- `PATCH /users/:id`: permite cambiar ciudad, pais, rol, estado, paciente default, password y huella.
- `DELETE /users/:id`: elimina tras verificar filas afectadas.

### 9.3 Autenticacion (`src/auth`)
| Metodo y ruta | Descripcion |
| --- | --- |
| `POST /auth/login` | Token JWT (ver 8.2). |
| `GET /auth/me` | Devuelve el perfil de la sesión autenticada, incluido `pacienteId` y `pacienteIds` resueltos desde el usuario y sus relaciones. Lo usa el dashboard para seleccionar el paciente principal. |
| `POST /auth/forgot-password` | Genera token de reset y lo reenvia por correo (si SMTP disponible). |
| `POST /auth/reset-password` | Consume token y asigna nueva clave. |
| `POST /auth/logout` | Revoca el `jwtId` actual (requiere Bearer).

### 9.4 Permiso de acceso (detalle en 8.5)
Ver rutas en la seccion de seguridad. Todos los endpoints se encuentran en `src/modules/permisoacceso/permisoacceso.controller.ts`.

### 9.5 Usuario-Paciente
Rutas descritas en 8.5 (`src/modules/usuariopaciente/`).

### 9.6 Notificaciones inteligentes (`src/notifications`)
| Metodo y ruta | Descripcion |
| --- | --- |
| `POST /notifications/parse` | Recibe `{ scheduleText, timezone?, referenceDate? }` y responde con la fecha en ISO tras pasar por `chrono-node`. Usa `NOTIFICATIONS_DEFAULT_TZ` cuando falta la zona. |
| `POST /notifications/natural` | Igual que parse, pero crea un registro real llamando a `NotificacionService.create`. El DTO extiende `CreateNotificacionDto` (usa `pacienteId`, `tipo`, `mensaje`, etc.) y rellena `fechaprogramada` con la fecha calculada. Guarda `campoprueba01` con el texto original y `campoprueba02` con la zona.

### 9.7 Periodo
- `POST /periodo`: registrar periodo.
- `PATCH /periodo/:id/sintomas`: registrar sintomas, dolor, flujo u observaciones.
- `GET /periodo/calendario/:pacienteId?mes=4&anio=2026`: ver calendario mensual con registros y predicciones.
- `GET /periodo/paciente/:pacienteId/prediccion`: obtener siguiente periodo, ovulacion estimada y ventana fertil.
- `GET /periodo/paciente/:pacienteId/historial`: listar historial y metricas basicas.
- `GET /periodo/paciente/:pacienteId/reporte-medico`: generar resumen clinico orientativo.

### 9.8 Salud mental
- `POST /salud-mental`: crear un registro diario completo.
- `PATCH /salud-mental/:id/registro-diario`: actualizar estado de animo, estres, ansiedad, sueno y nota personal.
- `PATCH /salud-mental/:id/habitos`: actualizar ejercicio, hidratacion, descanso, tiempo social y pausas digitales.
- `GET /salud-mental/paciente/:pacienteId/estadisticas`: promedio semanal, tendencia mensual y relacion sueno/animo.
- `GET /salud-mental/paciente/:pacienteId/alertas`: alertas por estres alto, poco sueno o cambios fuertes de animo.
- `GET /salud-mental/paciente/:pacienteId/reporte-medico?formato=pdf`: devuelve bloque `pdf`, graficas e historial por fecha.
- `GET /salud-mental/paciente/:pacienteId/historial?desde=2026-04-01&hasta=2026-04-30`: historial filtrado por fecha.

### 9.9 Gateway de base de datos (`src/database`)
Ya descrito en 7.4. Requiere JWT.

### 9.10 CRUD autogenerado de GestionSalud
Cada carpeta bajo `src/modules/<tabla>/` expone el mismo juego de rutas REST con el prefijo igual al nombre de la tabla. Ejemplos:
| Prefijo | Entidad TypeORM | Uso principal |
| --- | --- | --- |
| `paciente` | `src/modules/paciente/paciente.entity.ts` | Datos demograficos y de contacto del paciente. |
| `usuario` | `src/modules/usuario/usuario.entity.ts` | Replica directa de la tabla `usuario` (se usa principalmente via `users/`). |
| `rol`, `permiso`, `rolpermiso`, `usuariorol` | Control fino de roles/permisos a nivel tabla. |
| `especialidad`, `tipovacuna`, `tipolesion`, `tipooperacion`, `tipodocumentoclinico`, `tipocondicioncronica`, `tipohabito` | Catalogos de soporte.
| `consultamedica`, `citamedica`, `documentoclinico`, `examenclinico`, `seguimientopostevento`, `notificacion`, `recordatoriocita`, `medicacion`, `horariomedicamento`, `lesion`, `vacuna`, `operacion` | Registros clinicos principales.
| `desparasitacion`, `registrodental`, `registromensual`, `embarazo`, `controlprenatal` | Programas especificos.
| `alergia`, `antecedentefamiliar`, `habitoespecifico`, `puntajeriesgo`, `condicioncronica`, `objetivocronico`, `controlcronico`, `adherenciacronica`, `evaluacionsaludhabito`, `detalleevaluacionsalud` | Seguimiento de condiciones y habitos.
Cada servicio define `PRIMARY_KEYS` al inicio (`*.service.ts`). Para tablas con llaves compuestas, envia los IDs separados por coma siguiendo ese orden. Todas las respuestas devuelven el registro completo persistido via TypeORM.

## 10. Manejo de errores y validaciones
- DTOs usan `nestjs-zod`. Cuando faltan campos obligatorios, la respuesta 400 incluye `detalles[]` con `path`, `message` y `code` (`src/main.ts`).
- `fingerprintTemplateSchema` (`src/common/schemas/fingerprint.schema.ts`) asegura que las huellas lleguen en base64 (40-5000 caracteres). Mensajes especificos ayudan al cliente a depurar.
- Servicios CRUD autogenerados lanzan `NotFoundException` si la PK no coincide o `BadRequestException` cuando el ID no tiene el formato esperado.
- `DatabaseService` produce mensajes aclarando columnas invalidas, columnas esperadas en PK compuestas y errores SQL nativos, encapsulados en `InternalServerErrorException`.

## 11. Observabilidad y logging
- `morgan` registra cada request HTTP. Se recomienda redirigir stdout a un agregador (CloudWatch, ELK, etc.) en produccion.
- Autenticacion (`AuthService`) usa `Logger` de Nest para eventos exitosos (`login exitoso...`).
- `MailService` loguea advertencias cuando falta configuracion SMTP.
- `PermisoaccesoService` y otros servicios criticos usan `BadRequest`/`Forbidden` para exponer motivos al cliente (no se imprime nada sensible en consola). Considera agregar `nestjs/pino` o `winston` si se requiere trazabilidad extendida.

## 12. Operacion y despliegue
1. **Primer arranque local**
   ```bash
   cd Backend
   cp .env.example .env   # ajustar valores
   npm install
   npm run start:dev
   ```
   El log final deberia mostrar `api usuarios <version> escuchando ... - conexion a base de datos exitosa (gestionsalud)`.
   Si necesitas que cualquier paciente pueda registrarse desde la app aun despues de crear el usuario inicial, deja `ALLOW_PUBLIC_USER_REGISTRATION=true` en `.env`.
2. **Build para produccion**
   ```bash
   npm run build
   npm start   # usa dist/main.js
   ```
3. **Actualizacion de esquema**
   - Actualiza la base SQL primero.
   - Ejecuta `npm run generate:modules` para recrear entidades/servicios.
   - Compromete los archivos modificados en `src/modules/` y `gestionsalud.module.ts`.
4. **Migracion de credenciales**
   - Para habilitar autenticacion Windows: cambia `DB_AUTH` a `windows`, rellena `DB_USER` con `EQUIPO\usuario` (sin dominio) y especifica `DB_DOMAIN` si se requiere. Deja `DB_PASSWORD` vacio o elimina la linea.
5. **SMTP opcional**
   - Configura `MAIL_*` y verifica conectividad. Si falta, el backend seguira respondiendo pero no enviara correos; quedara log `correo smtp no configurado`.
6. **Monitoreo de permisos**
   - Revisa periodicamente la tabla `permisoacceso` y `permisoacceso_token` para limpiar permisos expirados (el servicio actualiza estados al listar, pero se puede programar un CRON adicional si es necesario).

## 13. Recomendaciones adicionales
- Protege `POST /users` detras de un rol administrador o elimina el decorador `@Public` una vez creado el primer usuario.
- Considera agregar pruebas e2e para flujos sensibles (login, reset, permisos QR) usando `@nestjs/testing`.
- Documenta los endpoints generados automaticamente en una coleccion (ej. Postman) para que el equipo movil tenga ejemplos concretos.
- Si se agregan nuevas tablas clinicas, actualiza `allowedTables` en `database.schemas.ts` y la lista `TABLES` del script para mantener ambos modulos sincronizados.
- Mantén la documentación de la app móvil alineada con los endpoints de sesión y dashboard; consulta `Documentacion/mobile.md`.

## 14. Observabilidad en el cliente
Aunque el backend expone logs estructurados, es necesario capturar la perspectiva del app movil para poder correlacionar incidentes:
- Integra un SDK como Sentry, Firebase Crashlytics o App Center en React Native/Expo para registrar fallos, rechazos de promesas y errores de JS nativos.
- Propaga el `requestId` o `traceId` entregado por el backend (puede extraerse del encabezado `x-request-id` si se agrega) en cada solicitud para enlazar eventos cliente-servidor.
- Envia metricas de uso (pantallas visitadas, duracion en formularios) anonimizadas para medir friccion en registros clinicos. Usa un buffer y reintentos para zonas con baja conectividad.
- Expone un modulo comun para logging (`logger.ts`) que normalice niveles (`info`, `warn`, `error`) y pueda redirigirlos a consola durante desarrollo y a un proveedor externo en produccion.

## 15. Sincronizacion offline
El dominio medico exige que la app funcione aun sin conectividad constante. Recomendaciones:
- Implementa un cache persistente (AsyncStorage, MMKV o WatermelonDB) que almacene los expedientes consultados y permita lectura offline.
- Diseña una cola de acciones pendientes (por ejemplo, `redux-offline`, `react-query` con `persister`) para formularios como `CitaFormScreen`, `VacunaFormScreen` o `RegistroDentalFormScreen`. Cada accion debe incluir un identificador temporal y politicas de reintento exponencial.
- Expone un indicador de estado (icono o banner) que informe si los datos estan sincronizados, pendientes o con errores. Permite reintentos manuales cuando se recupere la conexion.
- Define conflictos de escritura: cuando el backend responde 409/412, muestra al usuario las diferencias y ofrece fusionar o sobrescribir. Para campos sensibles (signos vitales, medicacion) prioriza la version mas reciente segun timestamp.
- Asegura que los JWT o tokens de acceso se refresquen incluso offline. Guarda el `refresh token` (si se implementa) cifrado y bloquea acciones criticas si el token expiro y no hay red para renovarlo.
