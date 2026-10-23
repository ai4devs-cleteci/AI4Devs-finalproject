#!/bin/bash
# Crea la base de datos de Keycloak, separada de la de la aplicación.
# Solo se ejecuta la primera vez que se inicializa el volumen.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER "${KEYCLOAK_DB_USER}" WITH PASSWORD '${KEYCLOAK_DB_PASSWORD}';
	CREATE DATABASE "${KEYCLOAK_DB}" OWNER "${KEYCLOAK_DB_USER}";
EOSQL
