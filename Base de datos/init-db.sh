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
  echo "Creando base de datos y aplicando esquema principal GestionSalud.sql..."
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -C -i /scripts/GestionSalud.sql
  echo "Esquema principal aplicado con exito."
else
  echo "La base de datos gestionsalud ya existe. Omitiendo creacion inicial."
fi

# Aplicar parches y tablas adicionales idempotentes
echo "Verificando scripts complementarios..."
if [ -f "/scripts/crear_passwordresettoken.sql" ]; then
  echo "Aplicando crear_passwordresettoken.sql..."
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -i /scripts/crear_passwordresettoken.sql || true
fi

if [ -f "/scripts/create-push-devices-table.sql" ]; then
  echo "Aplicando create-push-devices-table.sql..."
  $SQLCMD -S "$HOST,$PORT" -U "$USER" -P "$PASS" -d gestionsalud -C -i /scripts/create-push-devices-table.sql || true
fi

echo "Inicializacion de base de datos finalizada correctamente."
