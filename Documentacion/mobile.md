# Aplicación móvil y web Expo

La aplicación está en `App movil/GestionSaludExpo/` y usa Expo SDK 54, React Native, React Navigation y TypeScript. La misma base se ejecuta en Android y web.

## Ejecutar localmente

```powershell
cd "App movil/GestionSaludExpo"
npm ci

# Web
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000"
npm run web

# Android con Expo Go o emulador
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000"
npm run android
```

`EXPO_PUBLIC_API_URL` puede ser la raíz del servidor (`http://host:3000`) o incluir `/api/v1`. El archivo `src/config/api.ts` normaliza ambos formatos. Para teléfono físico, `localhost` no apunta al ordenador: usa la IP LAN del equipo y verifica que el firewall permita el puerto 3000.

Como respaldo de producción, `app.json` declara la URL de Render. No uses esa URL para validar cambios locales del backend que aún no se hayan desplegado.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run start` | Abre Expo/Metro. |
| `npm run web` | Inicia la versión web. |
| `npm run android` | Abre Android. |
| `npm run typecheck` | Valida TypeScript sin emitir archivos. |
| `npm run web:build` | Genera y valida el bundle web. |

Si Metro conserva una versión anterior, detén el servidor y ejecuta `npx expo start --clear`.

## Dashboard y selección de paciente

`src/components/DashboardBienestar.tsx` presenta actividad física, salud mental, hidratación y una puntuación orientativa. Al cargar:

1. Consulta `GET /auth/me` para obtener el paciente principal vigente de la sesión.
2. Consulta `GET /usuario-paciente/mis-pacientes` para las personas asociadas.
3. Carga los resúmenes del paciente seleccionado desde seguimiento físico y salud mental.

Si el dashboard muestra ceros o “Selecciona un paciente”, se debe verificar que la cuenta tenga `pacienteId` o una relación activa en `usuario_paciente`, que el token sea válido y que la API configurada tenga desplegado `GET /api/v1/auth/me`.

El dashboard toma el tema desde `BackgroundModeContext`: claro usa tarjetas blancas y oscuro tarjetas azul marino. Ambas vistas deben conservar los mismos datos y rutas de detalle.

## Nano y recursos SVG

Los Nano de menú se cargan directamente desde `src/svg/`. No se requieren versiones PNG por apariencia; solo `Nano Base.png` sigue siendo el recurso base cuando aplica.

El soporte SVG depende de:

- `react-native-svg` y `react-native-svg-transformer`.
- `metro.config.js`, que trata `.svg` como archivos fuente.
- `src/types/svg.d.ts`, que declara las importaciones SVG para TypeScript.
- `NanoAppearancePreview.tsx`, que renderiza un componente SVG o una imagen PNG según la apariencia.

Después de modificar la configuración de Metro o un SVG, reinicia Expo con `npx expo start --clear`.

## Build de distribución

`eas.json` define perfiles `preview` (APK interno) y `production` (AAB). Antes de crear una compilación, incrementa versión/versionCode cuando corresponda y revisa permisos declarados en `app.json`.

## Matriz mínima de pruebas manuales

| Caso | Resultado esperado |
| --- | --- |
| Web con cuenta y paciente principal | Dashboard muestra los mismos datos que Android. |
| Cuenta con varias personas asociadas | El selector cambia los indicadores del paciente. |
| Cuenta sin paciente asociado | Estado vacío explícito, sin datos mezclados. |
| Tema claro y oscuro | Mismo contenido; colores y contraste adecuados. |
| Navegación Inicio, Médico, Bienestar y Gestión | Cada pestaña muestra el SVG Nano correspondiente. |
| Móvil estrecho | No hay contenido tapado por la barra inferior. |
| Sin conexión y recuperación | Se muestra el estado offline y se sincronizan acciones pendientes. |
