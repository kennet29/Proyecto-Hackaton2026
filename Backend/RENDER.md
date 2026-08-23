# Deploy del backend en Render

## Tipo de servicio

Crear un `Web Service` de Node apuntando a este monorepo. El archivo [render.yaml](/c:/Users/kenne/OneDrive/Escritorio/HCKT%202026/Proyecto-Hackaton2026/render.yaml) ya deja configurado:

- `rootDir: Backend`
- `buildCommand: npm install && npm run build`
- `startCommand: npm start`
- `healthCheckPath: /api/v1/health`

## Variables de entorno

Carga estas variables en Render:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_AUTH=sql`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT=true`
- `DB_TRUST_SERVER_CERTIFICATE=false`
- `DB_CONNECTION_TIMEOUT_MS=60000`
- `DB_REQUEST_TIMEOUT_MS=60000`
- `DB_RETRY_ATTEMPTS=5`
- `DB_RETRY_DELAY_MS=5000`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `SHARE_LINK_BASE`
- `SHARE_LINK_SECRET`

## Notas importantes

- Render corre en Linux, asi que para SQL Server usa `DB_AUTH=sql`. No dependas de autenticacion Windows/NTLM alli.
- Si tu base de datos esta en Azure SQL, asegurate de permitir conexiones desde servicios externos y de usar `encrypt=true`.
- Si ves `ETIMEOUT` hacia `*.database.windows.net:1433`, primero confirma que Azure SQL permite conexiones desde la red de Render. Si la base es serverless o tarda en reactivarse, aumenta los timeouts y reintentos anteriores.
- Cuando el deploy termine, valida:
  - `https://tu-servicio.onrender.com/api/v1/health`
  - `https://tu-servicio.onrender.com/api/docs`
- Si tambien despliegas el frontend, agrega su dominio exacto en `CORS_ORIGINS`.
- Antes del deploy que habilita push remoto, ejecuta `scripts/create-push-devices-table.sql` en Azure SQL. Luego configura `PUSH_NOTIFICATIONS_ENABLED=true`.

## Orden de despliegue recomendado

1. Respaldar la base de datos y aplicar los scripts SQL pendientes en el ambiente objetivo.
2. Configurar o rotar secretos y variables de entorno en Render.
3. Desplegar el backend y comprobar `/api/v1/health`, `/api/docs` y `GET /api/v1/auth/me` con un token válido.
4. Configurar `EXPO_PUBLIC_API_URL` de la aplicación Expo con la URL del backend desplegado.
5. Validar inicio de sesión, selección de paciente en dashboard, permisos compartidos y notificaciones antes de publicar una compilación móvil.

No apuntes la app de producción a un backend que no tenga sus migraciones aplicadas: el dashboard, las notificaciones y los permisos dependen de la estructura de base de datos vigente.
