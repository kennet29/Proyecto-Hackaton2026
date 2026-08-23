# Inventario funcional — Gestión Salud

Fecha de revisión: 23 de agosto de 2026.

Este inventario describe lo disponible en el repositorio. “Implementado” indica que hay código de pantalla o endpoint; cada flujo debe validarse con datos reales antes de una entrega productiva.

## Estado general

| Área | Estado | Alcance |
| --- | --- | --- |
| Acceso y seguridad | Implementado | Registro, inicio de sesión, JWT, roles y cierre de sesión. |
| Expediente de salud | Implementado | Perfiles, personas asociadas, documentos y registros clínicos. |
| Bienestar | Implementado | Hábitos, actividad física, salud mental, período y dashboard. |
| Colaboración médica | Implementado | Solicitud de médico, permisos y compartir historial. |
| Administración y Premium | Implementado | Instituciones, clínicas, catálogos, solicitudes y pagos. |
| Notificaciones push | Parcial | Código disponible; requiere tabla y validación en producción. |
| Operación productiva | Parcial | Requiere migraciones controladas y pruebas de flujos críticos. |

## Módulos disponibles

| Dominio | Funciones principales |
| --- | --- |
| Cuentas | Registro, recuperación de contraseña, biometría compatible, roles y perfiles. |
| Pacientes | Personas asociadas, resumen, alergias, antecedentes, documentos y exámenes. |
| Atención médica | Consultas, citas, vacunas, medicación, condiciones crónicas, operaciones, lesiones, embarazo y registro dental. |
| Bienestar | Hábitos, seguimiento físico, salud mental, período, educación y Nano. |
| Dashboard | Selección de paciente, indicadores de actividad, salud mental, hidratación y tema claro/oscuro. |
| Colaboración | Solicitudes médicas, permisos temporales/permanentes, códigos QR y enlaces compartidos. |
| Administración | Instituciones, clínicas, catálogos, pagos Premium y suscripciones. |
| Notificaciones | Recordatorios, interpretación de fechas en lenguaje natural, cola offline y push. |

## API disponible sin pantalla móvil independiente

- Adherencia y objetivos crónicos.
- Control prenatal detallado.
- Evaluaciones de hábitos y detalle de evaluación de salud.
- Puntaje de riesgo.
- Administración granular de roles, permisos y relaciones usuario-rol.

## Pendientes priorizados

### Antes de producción

1. Aplicar `Backend/scripts/create-push-devices-table.sql` en la base de producción y validar notificaciones push en un dispositivo físico.
2. Configurar secretos de producción: `JWT_SECRET`, `ALTCHA_HMAC_SECRET`, credenciales SQL y SMTP si se envían correos reales.
3. Establecer un proceso versionado para scripts SQL, con orden de aplicación y procedimiento de reversión.
4. Validar de extremo a extremo permisos compartidos, adjuntos clínicos, Premium y recuperación de contraseña.
5. Verificar que cada cuenta tenga un paciente principal o relación `usuario_paciente` para evitar dashboards vacíos.

### Mejoras recomendadas

1. Extender el CI existente con pruebas e2e de login, permisos, dashboard y subida de adjuntos. Actualmente CI ejecuta typecheck, build y pruebas de backend, además del typecheck móvil.
2. Añadir auditoría clínica: quién creó, editó, compartió o revocó información y cuándo.
3. Definir política de cifrado, retención, respaldo y recuperación de documentos clínicos.
4. Agregar límites de intentos de inicio de sesión, revisión de permisos por rol y validación estricta de archivos.
5. Realizar pruebas de accesibilidad, rendimiento y usabilidad móvil con expedientes de gran volumen.

## Referencias

- [Documentación de backend](backend.md)
- [Guía de la aplicación Expo](mobile.md)
- `Backend/src/modules/`: módulos y entidades de API.
- `App movil/GestionSaludExpo/src/screens/`: pantallas de la aplicación.
- `Base de datos/` y `Backend/scripts/`: scripts de base de datos.
