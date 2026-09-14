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
  echo "La base de datos gestionsalud ya existe. Omitiendo creacion inicial."

  # Conserva las actualizaciones que ya eran seguras al reiniciar una base existente.
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -i /scripts/crear_passwordresettoken.sql
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -i /scripts/create-push-devices-table.sql
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -b -i /scripts/seed_admin_prueba.sql
fi

echo "Inicializacion de base de datos finalizada correctamente."
