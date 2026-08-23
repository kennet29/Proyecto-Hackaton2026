# Gestión Salud

Plataforma para gestionar expedientes clínicos, bienestar, colaboración médica y servicios administrativos. El repositorio contiene una API NestJS, una aplicación Expo para Android y web, y una landing page Angular.

## Componentes

| Componente | Carpeta | Tecnología |
| --- | --- | --- |
| API | `Backend/` | NestJS, TypeORM y SQL Server |
| Aplicación móvil y web | `App movil/GestionSaludExpo/` | Expo, React Native y TypeScript |
| Landing page | `Landing page/landingpage/` | Angular |
| Scripts SQL | `Base de datos/` | SQL Server |

## Inicio rápido

Requisitos: Node.js 20 LTS, npm y acceso a una base SQL Server configurada para el backend.

```powershell
# API
cd Backend
Copy-Item .env.example .env
npm ci
npm run start:dev

# En otra terminal: aplicación Expo
cd "App movil/GestionSaludExpo"
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000"
npm ci
npm run web
```

La API se publica bajo `http://localhost:3000/api/v1` y Swagger está disponible en `http://localhost:3000/api/docs`.

Para abrir la aplicación desde un teléfono físico, usa la IP local del equipo en vez de `localhost`, por ejemplo `http://192.168.1.20:3000`.

## Comprobaciones antes de integrar

```powershell
cd Backend
npm run typecheck
npm test
npm run build

cd "../App movil/GestionSaludExpo"
npm run typecheck
npm run web:build
```

GitHub Actions ejecuta estas validaciones de backend y móvil en cada push y pull request mediante `.github/workflows/ci.yml`.

## Documentación

- [API y backend](Documentacion/backend.md)
- [Aplicación Expo: configuración, SVG, dashboard y pruebas](Documentacion/mobile.md)
- [Inventario funcional y pendientes](Documentacion/INVENTARIO_MODULOS_Y_PENDIENTES.md)
- [Despliegue del backend en Render](Backend/RENDER.md)
- [Estrategia de pruebas del backend](Backend/TESTING.md)

## Despliegue

`render.yaml` configura el backend para Render. Antes de desplegar, configura las variables indicadas en `Backend/.env.example`, aplica los scripts SQL requeridos y valida `/api/v1/health` y `/api/docs`.

No publiques archivos `.env`, claves JWT, credenciales de base de datos ni tokens de proveedores.
