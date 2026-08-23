/**
 * @file Documentacion/INVENTARIO_MODULOS_Y_PENDIENTES.md
 * @description Implementa los elementos TypeScript de este módulo.
 */
# Inventario funcional � Gesti�n Salud

Fecha de revisi�n: 21 de agosto de 2026.

Este documento describe el estado observable del repositorio: aplicaci�n m�vil/web Expo, API NestJS y base de datos SQL Server. **Implementado** significa que existe una pantalla o endpoint asociado; debe validarse en el entorno desplegado antes de una entrega productiva.

## Resumen

| �rea | Estado | Alcance |
| --- | --- | --- |
| Acceso y seguridad | Implementado | Inicio de sesi�n, registro, recuperaci�n de clave, JWT, roles y cierre de sesi�n. |
| Expediente de salud | Implementado | Perfiles, personas asociadas, resumen cl�nico y registros m�dicos. |
| Bienestar | Implementado | H�bitos, actividad f�sica, salud mental y ciclo menstrual. |
| Colaboraci�n m�dica | Implementado | Solicitud de m�dico y acceso temporal/permanente al historial. |
| Administraci�n | Implementado | Cl�nicas, instituciones, cat�logos, solicitudes m�dicas y pagos Premium. |
| Notificaciones push | Parcial | C�digo presente; falta aplicar la tabla `dispositivopush` en producci�n. |
| Operaci�n productiva | Parcial | Requiere completar variables de entorno, migraciones y pruebas de despliegue. |

## M�dulos implementados

### 1. Acceso, cuentas y seguridad

| Funci�n | Descripci�n |
| --- | --- |
| Inicio y cierre de sesi�n | Autenticaci�n con usuario/contrase�a y tokens JWT; revocaci�n del token al cerrar sesi�n. |
| Registro de usuarios | Alta p�blica controlada por la configuraci�n del backend. |
| Recuperaci�n de contrase�a | Solicitud y consumo de token de restablecimiento. |
| Roles y permisos | Roles de paciente, m�dico, administrador y superadministrador; protecci�n de rutas. |
| Acceso biom�trico | Soporte de autenticaci�n local mediante `expo-local-authentication` cuando el dispositivo lo permite. |
| Personas asociadas | Una cuenta puede administrar y seleccionar expedientes de familiares o personas vinculadas. |

### 2. Perfil y expediente del paciente

| Funci�n | Descripci�n |
| --- | --- |
| Gesti�n de pacientes | Crear, editar, consultar y organizar perfiles de pacientes. |
| Resumen del paciente | Indicadores, alertas, progreso y vista consolidada del expediente. |
| Alergias y antecedentes familiares | Registro de reacciones, severidad, tratamiento y antecedentes. |
| Documentos cl�nicos | Adjuntar documentos y evidencia al expediente. |
| Ex�menes cl�nicos | Registrar laboratorio, tipo de examen, resultados, observaciones y archivos/fotos. |

### 3. Atenci�n y tratamientos m�dicos

| Funci�n | Descripci�n |
| --- | --- |
| Consultas m�dicas | Listado, creaci�n y edici�n de motivo, diagn�stico, tratamiento, m�dico y notas. |
| Citas m�dicas | Agenda, seguimiento, especialidad, profesional y estado de la cita. |
| Vacunas | Registro de dosis, lote, fecha y pr�ximas aplicaciones. |
| Medicaci�n | Medicamentos, dosis, v�a, fechas, indicaciones, receta y horarios. |
| Enfermedades cr�nicas | Condiciones, tipo de condici�n, metas y controles asociados. |
| Control cr�nico | Medici�n y seguimiento de condiciones ya abiertas. |
| Operaciones y lesiones | Registro de cirug�as, lesiones, tratamiento y estado de recuperaci�n. |
| Seguimiento de caso | Evoluci�n posterior a operaci�n, lesi�n o emergencia. |
| Registro dental | Procedimientos, diagn�stico, odont�logo y piezas tratadas. |
| Desparasitaci�n | Producto, dosis, fecha de aplicaci�n y pr�xima fecha. |
| Embarazo | Datos obst�tricos, c�lculo de fecha probable de parto y seguimiento prenatal base. |

### 4. Bienestar y prevenci�n

| Funci�n | Descripci�n |
| --- | --- |
| H�bitos | Registro de h�bitos, frecuencia, metas, resultado y observaciones. |
| Seguimiento f�sico | Peso, ejercicio, pasos, calor�as y distancia. |
| Salud mental | Estado de �nimo, estr�s, ansiedad, sue�o, hidrataci�n y notas diarias. |
| Per�odo menstrual | Registro de ciclo, duraci�n, dolor, s�ntomas y predicci�n. |
| Educaci�n saludable | Niveles, temas y contenido educativo dentro de la aplicaci�n. |
| Nano Bienestar | Asistente para an�lisis de comidas y recomendaciones, con historial y apariencias configurables. |

### 5. Recordatorios y notificaciones

| Funci�n | Descripci�n |
| --- | --- |
| Recordatorios | Crear, listar y programar avisos de citas, vacunas y medicamentos. |
| Lenguaje natural | El backend interpreta fechas descritas en texto para planificar recordatorios. |
| Cola sin conexi�n | Cambios de formularios pueden quedar pendientes y sincronizarse cuando regresa la conectividad. |
| Estado de sincronizaci�n | La interfaz muestra el estado de conexi�n y cambios pendientes. |
| Notificaciones push | Registro de token Expo y env�o de avisos pendientes cuando la tabla de dispositivos est� disponible. |

### 6. Colaboraci�n con profesionales de salud

| Funci�n | Descripci�n |
| --- | --- |
| Registro de m�dico | El profesional env�a sus credenciales para revisi�n. |
| Revisi�n administrativa | Administradores aprueban o rechazan solicitudes m�dicas. |
| Compartir historial | Generaci�n de c�digo o enlace temporal para compartir el expediente. |
| Historial compartido | El m�dico consulta el expediente autorizado y puede filtrar/buscar secciones. |
| Permisos de acceso | Permisos temporales o permanentes, con revocaci�n y control de acceso por paciente. |

### 7. Administraci�n, directorio y Premium

| Funci�n | Descripci�n |
| --- | --- |
| Instituciones y cl�nicas | Alta, edici�n y consulta de instituciones, horarios, especialidades e im�genes. |
| Cat�logos | Servicios y medicamentos asociados a las instituciones. |
| Pagos Premium | Configuraci�n bancaria y tipo de cambio; carga y revisi�n administrativa de comprobantes. |
| Suscripciones Premium | Activaci�n y consulta de suscripciones por usuario. |
| Nano Gesti�n | Configuraci�n de apariencia del asistente. |
| Contacto y acerca de | Pantallas de soporte, informaci�n del proyecto y navegaci�n responsive. |

## Funciones disponibles en backend sin pantalla m�vil independiente

Los siguientes dominios est�n modelados en la API/base de datos, pero no tienen una pantalla independiente en la navegaci�n actual. Pueden estar usados de forma interna o requerir integraci�n visible:

- Adherencia cr�nica y objetivos cr�nicos.
- Control prenatal detallado.
- Evaluaci�n de h�bitos y detalle de evaluaci�n de salud.
- Puntaje de riesgo.
- Cat�logos t�cnicos: especialidades, tipos de vacuna, lesi�n, operaci�n, documento y condici�n cr�nica.
- Gesti�n granular de roles, permisos y relaciones usuario-rol.

## Pendientes para completar la implementaci�n

### Bloqueantes t�cnicos actuales

1. **Crear la tabla de notificaciones push en producci�n.** Ejecutar `Backend/scripts/create-push-devices-table.sql` en la base `gestionsalud`. Sin esta tabla, el servicio registra el error `Invalid object name 'dispositivopush'` y no procesa notificaciones push.
2. **Configurar `JWT_SECRET` en Render.** Debe existir y tener al menos 32 caracteres. Si falta, NestJS no inicia.
3. **Configurar correo SMTP si se requiere env�o real de recuperaci�n de contrase�a.** Sin las variables `MAIL_*`, el backend puede generar el flujo, pero no entrega correos.
4. **Aplicar las migraciones SQL pendientes de forma controlada.** Los scripts est�n en `Base de datos/` y `Backend/scripts/`; actualmente su ejecuci�n es manual y debe documentarse por ambiente.

### Integraciones por finalizar o validar

1. Probar notificaciones push en un dispositivo f�sico con un build de Expo/EAS; los navegadores y Expo Go tienen limitaciones seg�n plataforma.
2. Validar de extremo a extremo los permisos de historial compartido: generar c�digo, abrirlo como m�dico, vencerlo y revocarlo.
3. Validar carga y descarga de documentos/ex�menes, incluidos tama�o de archivo, formatos permitidos y errores de red.
4. Confirmar el flujo Premium completo: comprobante, revisi�n administrativa, aprobaci�n/rechazo y activaci�n de suscripci�n.
5. Completar interfaz m�vil para los m�dulos API sin pantalla independiente, si se incluir�n en el alcance del producto.

### Mejoras recomendadas antes de producci�n

1. Automatizar migraciones de base de datos dentro del despliegue, con historial y reversi�n.
2. Incorporar CI que ejecute typecheck, pruebas unitarias/integraci�n y pruebas e2e antes de desplegar.
3. A�adir auditor�a funcional: qui�n cre�, modific�, comparti� o revoc� informaci�n cl�nica, con consulta administrativa.
4. Definir retenci�n, respaldo, cifrado y procedimiento de recuperaci�n de documentos cl�nicos.
5. Realizar revisi�n de seguridad: rotaci�n de secretos, l�mites de intentos de login, validaci�n de archivos y revisi�n de permisos por rol.
6. Preparar pruebas de accesibilidad, usabilidad m�vil y rendimiento con expedientes de gran volumen.

## Referencias t�cnicas

- Navegaci�n m�vil: `App movil/GestionSaludExpo/src/navigation/types.ts`.
- Pantallas: `App movil/GestionSaludExpo/src/screens/`.
- M�dulos de API: `Backend/src/modules/`.
- Contratos y rutas de API: `Documentacion/backend.md`.
- Scripts de base de datos: `Base de datos/` y `Backend/scripts/`.
