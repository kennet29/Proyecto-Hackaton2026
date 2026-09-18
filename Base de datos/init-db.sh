#!/usr/bin/env bash
set -e

SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
HOST="${DB_HOST:-sqlserver}"
PORT="${DB_PORT:-1433}"
USER="${DB_USER:-sa}"
PASS="${DB_PASSWORD:-GestionSalud_2026!}"

echo "Esperando conexion a SQL Server en $HOST:$PORT..."
for i in {1..60}; do
  if $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -C -Q "SELECT 1" &> /dev/null; then
    echo "SQL Server esta listo para recibir consultas."
    break
  fi
  echo "Esperando a SQL Server ($i/60)..."
  sleep 2
done

echo "Verificando existencia de la base de datos gestionsalud..."
DB_COUNT=$($SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -C -h -1 -W -Q "SET NOCOUNT ON; SELECT count(*) FROM sys.databases WHERE name = 'gestionsalud'")

if [ "$DB_COUNT" -ne "0" ]; then
  echo "La base de datos gestionsalud ya existe. Esperando que termine su recuperacion y pase a ONLINE..."
  for i in {1..30}; do
    if $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -Q "SELECT 1" &> /dev/null; then
      echo "La base de datos gestionsalud esta ONLINE y lista para recibir consultas."
      break
    fi
    echo "Esperando que gestionsalud este disponible ($i/30)..."
    sleep 2
  done
fi

# Orden unico de las migraciones que complementan el esquema base. Mantener esta
# lista alineada con database.sql: asi una base ya creada recibe exactamente las
# mismas actualizaciones que una base nueva.
MIGRATION_SCRIPTS=(
  "/scripts/GestionSalud.sql"
  "/scripts/renombrar_campos_seguridad_usuario.sql"
  "/scripts/usuario_ciudad_pais.sql"
  "/scripts/crear_passwordresettoken.sql"
  "/scripts/create-push-devices-table.sql"
  "/scripts/configuracion_pagos.sql"
  "/scripts/directorio_salud.sql"
  "/scripts/embarazo_datos_obstetricos.sql"
  "/scripts/examenclinico.sql"
  "/scripts/habitos_catalogo.sql"
  "/scripts/nutricion_comida.sql"
  "/scripts/suscripcion_premium.sql"
  "/scripts/pagos_premium.sql"
  "/scripts/periodo.sql"
  "/scripts/recordatorios_origen_generico.sql"
  "/scripts/saludmental.sql"
  "/scripts/agregar_documento_cedula_medicoregistro.sql"
  "/scripts/seguimiento_fisico.sql"
  "/scripts/seguimiento_postevento.sql"
  "/scripts/usuario_apariencia_nano.sql"
  "/scripts/seed_admin_prueba.sql"
  "/scripts/medico_prueba.sql"
)

apply_optional_scripts() {
  # Carga de datos ficticios extensa. Requiere que exista admin.hckt.2026.
  if [ "${SEED_FULL_DEMO_DATA:-false}" = "true" ]; then
    echo "Cargando datos ficticios completos..."
    $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -i /scripts/seed_admin_pruebas.sql
  fi

  # Esta migracion reescribe datos de texto existentes; nunca debe aplicarse
  # sin una decision explicita del administrador.
  if [ "${APPLY_UTF8_REPAIR:-false}" = "true" ]; then
    echo "Aplicando correccion de codificacion UTF-8..."
    $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -i /scripts/corregir_codificacion_utf8.sql
  fi
}

if [ "$DB_COUNT" -eq "0" ]; then
  echo "Creando base de datos y aplicando database.sql..."
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -C -b -i /scripts/database.sql
  if [ "${SEED_DEMO_USERS:-true}" != "true" ]; then
    echo "Eliminando usuarios de demostracion de la base nueva..."
    $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -Q "DELETE FROM dbo.usuario WHERE nombreusuario IN (N'kenneth', N'connie', N'admin.prueba')"

    if [ -n "${INITIAL_ADMIN_USERNAME:-}" ] && [ -n "${INITIAL_ADMIN_PASSWORD_HASH_B64:-}" ]; then
      ADMIN_HASH=$(printf '%s' "$INITIAL_ADMIN_PASSWORD_HASH_B64" | base64 -d)
      $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b \
        -v ADMIN_USERNAME="$INITIAL_ADMIN_USERNAME" ADMIN_HASH="$ADMIN_HASH" \
        -Q "IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombreusuario = N'\$(ADMIN_USERNAME)') INSERT INTO dbo.usuario (nombreusuario, hashpassword, rolprincipal, activo, creadopor) VALUES (N'\$(ADMIN_USERNAME)', CONVERT(VARBINARY(256), '\$(ADMIN_HASH)'), N'admin', 1, N'bootstrap_produccion')"
      echo "Administrador inicial de produccion creado."
    else
      echo "ADVERTENCIA: no se creo administrador inicial. Define INITIAL_ADMIN_USERNAME e INITIAL_ADMIN_PASSWORD_HASH_B64."
    fi
  fi
  echo "Esquema y datos de prueba aplicados con exito."
else
  echo "La base de datos gestionsalud ya existe. Verificando esquema y aplicando migraciones pendientes..."

  # GestionSalud.sql y las migraciones son 100% idempotentes (IF OBJECT_ID / IF COL_LENGTH):
  # Crean tablas y columnas que falten y omiten de forma segura las ya existentes sin tocar datos.
  for SCRIPT in "${MIGRATION_SCRIPTS[@]}"; do
    if [ -f "$SCRIPT" ]; then
      echo "Aplicando verificacion/migracion: $(basename "$SCRIPT")..."
      $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -i "$SCRIPT"
    fi
  done
fi

apply_optional_scripts

echo "Inicializacion de base de datos finalizada correctamente."
