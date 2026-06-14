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
- Cuando el deploy termine, valida:
  - `https://tu-servicio.onrender.com/api/v1/health`
  - `https://tu-servicio.onrender.com/api/docs`
- Si tambien despliegas el frontend, agrega su dominio exacto en `CORS_ORIGINS`.
