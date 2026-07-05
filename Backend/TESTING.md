# Testing

El backend usa Jest con TypeScript mediante `ts-jest`.

## Niveles

### Nivel 1: unitarios

Prueban funciones y servicios aislados con mocks. No deben conectarse a la base
de datos real.

```powershell
npm.cmd run test:unit
```

Ejemplos actuales:

- `src/auth/auth.service.spec.ts`
- `src/auth/utils/role.util.spec.ts`
- `src/common/database/database-error.util.spec.ts`
- `src/common/utils/base64-image.util.spec.ts`

### Nivel 2: controladores

Prueban que los controladores deleguen correctamente en servicios y formen la
respuesta esperada.

```powershell
npm.cmd run test:controller
```

Ejemplos actuales:

- `src/health/health.controller.spec.ts`
- `src/version/version.controller.spec.ts`
- `src/auth/auth.controller.spec.ts`
- `src/users/users.controller.spec.ts`
- `src/modules/paciente/paciente.controller.spec.ts`
- `src/modules/permisoacceso/permisoacceso.controller.spec.ts`
- `src/database/database.controller.spec.ts`
- `src/nano/nano.controller.spec.ts`
- `src/notifications/notifications.controller.spec.ts`

### Nivel 3: integracion

Prueban wiring de Nest con `TestingModule`: controllers y providers reales,
pero usando mocks para recursos externos como base de datos, correo o APIs.

```powershell
npm.cmd run test:integration
```

Ejemplos actuales:

- `src/version/version.integration.spec.ts`
- `src/health/health.integration.spec.ts`
- `src/database/database.integration.spec.ts`
- `src/notifications/notifications.integration.spec.ts`

### Nivel 4: e2e

Prueban la API por HTTP con una aplicacion Nest levantada en memoria. Usan mocks
para dependencias externas, pero validan rutas, prefijos, versionado y filtros
globales desde el punto de vista de un cliente real.

```powershell
npm.cmd run test:e2e
```

Ejemplos actuales:

- `src/app.e2e-spec.ts`

### Todos los tests

```powershell
npm.cmd test
```

### Modo observador

```powershell
npm.cmd run test:watch
```

## Convencion

Los archivos de prueba deben terminar en `.spec.ts`.
