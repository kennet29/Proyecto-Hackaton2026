/*
  Punto unico de inicializacion para una base de datos nueva.
  Ejecutar con sqlcmd para que las directivas :r incluyan cada bloque
  en una sola ejecucion.
*/
:r /scripts/GestionSalud.sql
:r /scripts/renombrar_campos_seguridad_usuario.sql
:r /scripts/usuario_ciudad_pais.sql
:r /scripts/crear_passwordresettoken.sql
:r /scripts/create-push-devices-table.sql
:r /scripts/configuracion_pagos.sql
:r /scripts/directorio_salud.sql
:r /scripts/embarazo_datos_obstetricos.sql
:r /scripts/examenclinico.sql
:r /scripts/habitos_catalogo.sql
:r /scripts/nutricion_comida.sql
:r /scripts/suscripcion_premium.sql
:r /scripts/pagos_premium.sql
:r /scripts/periodo.sql
:r /scripts/recordatorios_origen_generico.sql
:r /scripts/saludmental.sql
:r /scripts/agregar_documento_cedula_medicoregistro.sql
:r /scripts/seguimiento_fisico.sql
:r /scripts/seguimiento_postevento.sql
:r /scripts/usuario_apariencia_nano.sql
:r /scripts/seed_admin_prueba.sql
:r /scripts/medico_prueba.sql

/*
  Scripts con ejecucion deliberadamente manual desde init-db.sh:
  - seed_admin_pruebas.sql: datos ficticios completos (SEED_FULL_DEMO_DATA=true).
  - corregir_codificacion_utf8.sql: reescribe datos de texto existentes
    (APPLY_UTF8_REPAIR=true).

  Script2.sql y "Respaldo 1 de Julio.sql" son exportaciones completas de SQL
  Server. Crean la base gestionsalud con configuracion de otro entorno y no son
  migraciones; ejecutarlos junto a este inicializador causaria conflictos.
*/
