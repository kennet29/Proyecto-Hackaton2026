# Gestión Salud

Plataforma de salud digital para centralizar expedientes clínicos, seguimiento de bienestar, colaboración entre pacientes y profesionales, recordatorios y administración de servicios. El repositorio contiene la API, la aplicación Expo y la landing page pública.

## Arquitectura

```text
                         ┌──────────────────────────┐
                         │ Landing page (Angular)   │
                         │ Información y captación  │
                         └──────────────────────────┘

┌────────────────────────────┐       HTTPS / REST       ┌────────────────────────────┐
│ App móvil y web (Expo)     │ ───────────────────────▶ │ API (NestJS)               │
│ React Native + TypeScript  │ ◀─────────────────────── │ JWT, roles y validación    │
│ Pacientes, médicos y admin │                           │ /api/v1 + Swagger          │
└────────────────────────────┘                           └─────────────┬──────────────┘
                                                                    │ TypeORM
                                                                    ▼
                                                       ┌──────────────────────────┐
                                                       │ SQL Server               │
                                                       │ Datos clínicos y cuentas │
                                                       └──────────────────────────┘
```

| Componente | Ubicación | Tecnología | Responsabilidad |
| --- | --- | --- | --- |
| API | `Backend/` | NestJS 11, TypeORM, SQL Server | Autenticación, reglas de negocio, API REST y documentación Swagger. |
| Aplicación | `App movil/GestionSaludExpo/` | Expo, React Native, React Navigation, TypeScript | Experiencia para Android y web; consulta y captura de datos clínicos. |
| Landing | `Landing page/landingpage/` | Angular 16, Leaflet | Presentación del producto, mapa informativo y planes. |
| Base de datos | `Base de datos/` | SQL Server | Esquema, semillas y cambios SQL versionados manualmente. |
| Documentación | `Documentacion/` | Markdown y HTML | Guías técnicas, inventario funcional y resumen del producto. |

## Capacidades principales

- Cuentas, autenticación JWT, roles, biometría compatible y recuperación de contraseña.
- Expediente clínico con personas asociadas, consultas, citas, vacunas, medicación, exámenes, documentos y antecedentes.
- Bienestar: actividad física, salud mental, hábitos, nutrición, período y dashboard por paciente.
- Colaboración médica mediante solicitudes, permisos de acceso, QR y enlaces compartidos.
- Administración de instituciones, clínicas, servicios, pagos Premium y suscripciones.
- Recordatorios, notificaciones push y operación offline para flujos compatibles.
- Nano: asistente nutricional con análisis de comidas y apariencias desbloqueables.

## Estructura relevante

```text
Proyecto-Hackaton2026/
├─ App movil/GestionSaludExpo/
│  ├─ App.tsx                       # Navegación y composición de la app
│  ├─ src/screens/                  # Pantallas por flujo funcional
│  ├─ src/components/               # Componentes reutilizables y dashboard
│  ├─ src/context/                  # Sesión y tema
│  ├─ src/utils/                    # Caché, cola offline, pacientes y recordatorios
│  ├─ src/config/api.ts             # Resolución de URL de la API
│  └─ src/svg/                      # Recursos de Nano
├─ Backend/
│  ├─ src/auth/                     # JWT, roles, permisos y recuperación
│  ├─ src/modules/                  # Dominios clínicos y administrativos
│  ├─ src/nano/                     # Análisis de comidas y apariencias Nano
│  ├─ src/notifications/            # Recordatorios y push
│  ├─ src/common/                   # Filtros, validaciones e idempotencia
│  ├─ src/main.ts                   # Prefijo /api/v1, CORS y Swagger
│  └─ scripts/                      # Generación de módulos y SQL auxiliar
├─ Landing page/landingpage/        # Aplicación Angular pública
├─ Base de datos/                   # Scripts SQL que deben aplicarse conscientemente
├─ Documentacion/                   # Guías funcionales y técnicas
├─ .github/workflows/               # CI y despliegue de la landing
└─ render.yaml                      # Servicio backend en Render
```

## Requisitos

- Node.js 20 LTS y npm.
- SQL Server accesible para el backend.
- Android Studio/emulador o Expo Go para probar Android (opcional).
- Una dirección IP LAN del equipo para probar desde un teléfono físico.

## Inicio rápido

### 1. Backend

```powershell
cd Backend
Copy-Item .env.example .env
# Edita .env con las credenciales de una base SQL Server válida y un JWT_SECRET seguro.
npm ci
npm run start:dev
```

La API queda disponible en `http://localhost:3000/api/v1`.

- Salud: `GET http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/api/docs`
- Versión: `GET http://localhost:3000/api/v1/version`

### 2. Aplicación Expo

En otra terminal:

```powershell
cd "App movil/GestionSaludExpo"
npm ci

# Web local
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000"
npm run web
```

Para Android físico, usa la IP LAN del equipo; `localhost` apunta al teléfono, no al ordenador.

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000"
npm run android
```

`EXPO_PUBLIC_API_URL` acepta la raíz del servidor o una URL que ya incluya `/api/v1`; la aplicación normaliza ambas formas. Si no se define en producción, se usa la URL configurada en `app.json`.

### 3. Landing page

```powershell
cd "Landing page/landingpage"
npm ci
npm start
```

Abre `http://localhost:4200/`. Para un artefacto de producción usa `npm run build`.

## Configuración

El archivo [Backend/.env.example](Backend/.env.example) contiene la plantilla de configuración. Nunca subas un `.env` real.

| Grupo | Variables principales |
| --- | --- |
| Servidor | `PORT`, `REQUEST_BODY_LIMIT`, `CORS_ORIGINS` |
| Base de datos | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_AUTH`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT` |
| Seguridad | `JWT_SECRET`, `JWT_EXPIRES_IN`, `ALTCHA_HMAC_SECRET`, `ALLOW_PUBLIC_USER_REGISTRATION` |
| Integraciones | `OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `MAIL_*`, `PUSH_NOTIFICATIONS_ENABLED` |
| Dominio | `NANO_UNLOCK_TIME_ZONE`, `SHARE_LINK_BASE`, `SHARE_LINK_SECRET` |

`JWT_SECRET` es obligatorio y debe tener como mínimo 32 caracteres. Configura `CORS_ORIGINS` con los dominios exactos de la web y la landing en entornos publicados.

## Desarrollo y calidad

Ejecuta las verificaciones antes de integrar cambios:

```powershell
# Backend
cd Backend
npm run lint
npm test
npm run build

# Aplicación Expo
cd "../App movil/GestionSaludExpo"
npm run lint
npm run web:build

# Landing
cd "../../Landing page/landingpage"
npm run build
```

El flujo de CI en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta lint, pruebas y build del backend, y typecheck de la aplicación Expo en cada push y pull request. La landing se construye y despliega en GitHub Pages mediante [`deploy-landing-pages.yml`](.github/workflows/deploy-landing-pages.yml) cuando se actualiza `main`.

### Pruebas del backend

```powershell
cd Backend
npm run test:unit
npm run test:controller
npm run test:integration
npm run test:e2e
```

Consulta [Backend/TESTING.md](Backend/TESTING.md) para el alcance de cada nivel.

## Datos y cambios de esquema

TypeORM se ejecuta con `synchronize: false`: los cambios de esquema no se aplican automáticamente. Antes de levantar o desplegar una versión que dependa de una nueva tabla o columna:

1. Revisa y aplica el script correspondiente de `Base de datos/` o `Backend/scripts/`.
2. Respalda la base de datos del entorno objetivo.
3. Si cambió una tabla generada, ejecuta `npm run generate:modules` dentro de `Backend/`.
4. Compila y valida los flujos que usen ese cambio.

## Despliegue

- **Backend:** [render.yaml](render.yaml) define un Web Service de Render con `Backend/` como raíz, `npm run build` y health check en `/api/v1/health`.
- **Landing:** GitHub Actions publica la compilación en GitHub Pages.
- **Móvil:** [eas.json](<App movil/GestionSaludExpo/eas.json>) incluye perfiles `preview` (APK interno) y `production` (AAB).

Antes de publicar, configura secretos y variables en el proveedor, aplica los scripts SQL pendientes y valida salud, Swagger, autenticación, permisos, adjuntos y notificaciones. La guía paso a paso para Render está en [Backend/RENDER.md](Backend/RENDER.md).

## Seguridad y datos clínicos

- No publiques `.env`, secretos JWT, contraseñas SQL, tokens de OpenAI ni credenciales SMTP.
- Mantén acceso HTTPS, una lista CORS específica y secretos distintos por entorno.
- Comprueba las relaciones `usuario_paciente` y el paciente principal; son necesarios para que el dashboard cargue datos correctamente.
- Trata los adjuntos y expedientes como información sensible: define respaldos, retención, auditoría y control de acceso antes de producción.

## Documentación adicional

- [Arquitectura, API y operación del backend](Documentacion/backend.md)
- [Aplicación Expo: API, Nano, dashboard y pruebas manuales](Documentacion/mobile.md)
- [Inventario funcional y pendientes priorizados](Documentacion/INVENTARIO_MODULOS_Y_PENDIENTES.md)
- [Resumen visual de módulos](Documentacion/Resumen_Modulos_GestionSalud.html)
- [Estrategia de pruebas](Backend/TESTING.md)
- [Despliegue en Render](Backend/RENDER.md)

## Contribución

1. Crea una rama con un objetivo acotado.
2. Mantén los cambios de base de datos acompañados de su script y de documentación si afectan a un flujo.
3. Ejecuta las verificaciones de la sección **Desarrollo y calidad**.
4. Actualiza esta guía o la documentación específica cuando cambien arquitectura, configuración, rutas o despliegue.
