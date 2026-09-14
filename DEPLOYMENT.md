# Despliegue de producción

1. Copia el proyecto al servidor Linux con Docker Engine y Docker Compose.
2. Edita `.env`: cambia `SERVER_DOMAIN`, `CADDY_EMAIL` y conserva las credenciales generadas en un gestor de contraseñas.
3. Crea un registro DNS `A` para el dominio que apunte a la IP pública del servidor y permite TCP `80` y `443` en el firewall.
4. Inicia los servicios:

```bash
docker compose --env-file .env -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

5. Comprueba el arranque:

```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml ps
docker compose -f docker-compose.yml -f docker-compose.production.yml logs -f caddy gateway backend
```

El primer inicio crea el administrador definido en `.env` y elimina los usuarios de demostración. Este comportamiento solo aplica a una base nueva; no borra usuarios de un volumen SQL existente.
