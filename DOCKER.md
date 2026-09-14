# Guía de Despliegue con Docker y Dominio Único — Gestión Salud

Esta configuración permite correr toda la plataforma de **Gestión Salud** bajo un **único subdominio** (o localhost en puerto 80) mediante un **Gateway Nginx**, además de permitir convivir con **otras instancias de SQL Server** en tu servidor gracias a un puerto de base de datos configurable.

---

## 1. Arquitectura de Servicios y Puertos

```text
  Navegador / App
         │
         ▼  http://salud.tudominio.com  (Puerto 80 / Gateway Nginx)
 ┌────────────────────────────────────────────────────────┐
 │                   GATEWAY NGINX                        │
 └──────┬───────────────────────┬──────────────────┬──────┘
        │ /                     │ /app/            │ /api/
        ▼                       ▼                  ▼
 ┌──────────────┐       ┌──────────────┐   ┌──────────────┐
 │ Landing Page │       │ App Web Expo │   │ Backend REST │
 │ Angular      │       │ React Native │   │ NestJS 11    │
 └──────────────┘       └──────────────┘   └──────┬───────┘
                                                  │ TCP 1433 (Red interna Docker)
                                                  ▼
                                           ┌──────────────┐
                                           │ SQL Server   │ ◀─── Puerto Host: 14333
                                           │ 2022         │      (Sin colisión con 1433)
                                           └──────────────┘
```

| Componente | Ruta en tu Subdominio | Puerto Interno | Puerto en el Host |
| :--- | :--- | :--- | :--- |
| **Gateway (Punto Único)** | `salud.tudominio.com` | `80` | `80` (Configurable en `GATEWAY_HTTP_PORT`) |
| **Landing Page** | `salud.tudominio.com/` | `4200` | Interno (opcional 4200) |
| **App Web (Expo)** | `salud.tudominio.com/app/` | `8081` | Interno (opcional 8081) |
| **Backend REST & Swagger**| `salud.tudominio.com/api/` | `3000` | Interno (opcional 3000) |
| **SQL Server** | *(No público)* | `1433` | `14333` (Configurable en `MSSQL_EXTERNAL_PORT`) |

---

## 2. Convivencia con otras instancias de SQL Server

Si tu servidor ya tiene Microsoft SQL Server instalado o corriendo en el puerto por defecto `1433`:

* Este contenedor mapea por defecto al puerto **`14333`** del servidor anfitrión.
* Si deseas cambiarlo a otro puerto (por ejemplo `1434` o `14330`), simplemente edita en tu archivo `.env`:
  ```env
  MSSQL_EXTERNAL_PORT=1434
  ```
* **Para conectarte desde SSMS, Azure Data Studio o DBeaver en ese servidor:**
  * **Servidor:** `localhost,14333` (o `IP_DEL_SERVIDOR,14333`)
  * **Usuario:** `sa`
  * **Contraseña:** la definida en `MSSQL_SA_PASSWORD` (`GestionSalud_2026!`)
  * **Base de datos:** `gestionsalud`

---

## 3. Inicio Rápido

### Paso 1: Configurar Variables de Entorno

```powershell
Copy-Item .env.docker.example .env
```

*(Si vas a apuntar a tu subdominio real, por ejemplo `salud.miempresa.com`, puedes ajustar `CORS_ORIGINS` y `SHARE_LINK_BASE` en el archivo `.env`).*

### Paso 2: Construir y Levantar los Contenedores

```powershell
docker compose up -d --build
```

Docker construirá el Gateway, el Backend, la Landing Page, la App Web y levantará SQL Server ejecutando la inicialización automática de tablas.

### Paso 3: Verificar Estado

```powershell
docker compose ps
```

Deberás ver los servicios `gestionsalud-gateway`, `gestionsalud-backend`, `gestionsalud-landing`, `gestionsalud-app-web` y `gestionsalud-sqlserver` activos.

---

## 4. URLs de Acceso desde el Navegador

Entrando por el Gateway (puerto 80 o tu subdominio):

* **Landing Page:** [http://localhost/](http://localhost/)
* **App Web (Clínica y Bienestar):** [http://localhost/app/](http://localhost/app/)
* **Documentación Swagger API:** [http://localhost/api/docs](http://localhost/api/docs)
* **Healthcheck API:** [http://localhost/api/v1/health](http://localhost/api/v1/health)

---

## 5. Configurar HTTPS / SSL con tu Proveedor

Al tener todo detrás del Gateway Nginx en el puerto 80:

* Si usas **Cloudflare**: Activa el proxy (nube naranja) apuntando al registro `A` de tu servidor y selecciona modo SSL *Flexible* o *Full*.
* Si usas **Nginx Proxy Manager** o **Traefik** en tu servidor: Enruta tu subdominio hacia el puerto `80` del contenedor `gestionsalud-gateway`.
* Si usas **Certbot directo**: Puedes mapear el puerto `443:443` en el gateway montando los certificados Let's Encrypt en `/etc/letsencrypt`.
