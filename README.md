**Guillermina Gatti**

# Santex Academy - FootballAPI

Aplicación web para gestionar jugadores de FIFA, de ambos géneros.

Este repositorio es un fork personal del proyecto base de SantexAcademy.

- **Backend:** Node.js 26, NestJS 11, Sequelize, MySQL 9.7
- **Frontend:** Angular 20, Chart.js (pendiente, se agrega en el commit 13)
- **Infraestructura:** Docker Compose


## Requisitos previos

- Docker Desktop en Windows, con el backend WSL 2 habilitado (Settings → General → "Use the WSL 2 based engine").
- Git.
- Node.js 26, solo si querés correr el backend fuera de Docker.

## Pasos para correr

1. Clonar el repositorio:

   ```bash
   git clone <URL_DE_TU_REPOSITORIO>
   ```

2. Navegar a la carpeta del proyecto:

   ```bash
   cd football-api
   ```

3. Copiar las variables de entorno del archivo de ejemplo al de ambiente. En PowerShell:

   ```powershell
   Copy-Item .env.sample .env
   ```

   En Linux o macOS:

   ```bash
   cp .env.sample .env
   ```

4. Completar en `.env` los valores que correspondan. La clave `GOOGLE_API_KEY` se obtiene en Google AI Studio (https://aistudio.google.com), con una cuenta de Google. Todavía no se usa: el análisis con LangChain llega más adelante, así que puede quedar vacía por ahora. Nunca subas `.env` al repositorio.

5. Levantar todo:

   ```bash
   docker compose up --build
   ```

   La primera vez tarda varios minutos, porque descarga imágenes e instala dependencias. Después alcanza con `docker compose up`.

| Servicio | URL |
|---|---|
| API | http://localhost:3000 |
| Frontend | http://localhost:4200 |
| MySQL | localhost:3306 |

### Carga inicial de datos

Por ahora la base se llena con el seed `docker/db/init.sql`, que solo contiene jugadores masculinos y no está completo. La carga completa de hombres y mujeres se hace con el importador de CSV, que se documenta cuando esté implementado. Los archivos CSV no se versionan: se colocan en la carpeta `football-api/data/`.

## Verificación

Con los servicios levantados:

```bash
# Ver el rango de IDs que existen en la base.
# La contraseña es el valor de MYSQL_ROOT_PASSWORD en .env.
docker exec santex_academy_football_api_db mysql -uroot -proot football_db -e "SELECT MIN(id), MAX(id) FROM players;"

# Reemplazar 1 por un ID real. Debe responder 200 con JSON
curl -i http://localhost:3000/api/players/1

# Un ID inexistente debe responder 404
curl -i http://localhost:3000/api/players/999999
```

En PowerShell usá `curl.exe` en lugar de `curl`.

## Alternativa

Instrucciones para correr cada servicio por separado.

### Reiniciar los datos

```bash
docker compose down -v   # Detiene los contenedores y elimina los volúmenes (incluido db_data)
docker compose up -d     # Vuelve a crear todo desde cero
```

### Conectarse a MySQL desde la terminal

```bash
mysql -h 127.0.0.1 -P 3306 --user=football_api --password=password football_db
```

```sql
SHOW TABLES;
SELECT COUNT(*) FROM players;
EXIT;
```

### Inicializar la API

Desde la carpeta `backend/`:

```bash
cd backend
npm install
```

### Compilar y correr el backend

```bash
# desarrollo
npm run start

# modo watch
npm run start:dev

# producción
npm run start:prod
```

### Migraciones

```bash
# aplicar las migraciones pendientes
npm run migrate

# revertir la última migración
npm run migrate:undo
```

## Decisiones técnicas y funcionales

### Fork del repositorio base

Usamos el fork del proyecto base de SantexAcademy en lugar de empezar de cero. La base ya trae Docker Compose, el backend en NestJS y el frontend en Angular, así que `docker compose up` funciona sin rearmar la infraestructura. Lo comprobamos levantando los tres servicios y consultando `GET /api/players/:id`.

Para verificarlo:
1. Ejecutar `docker compose up --build`.
2. Comprobar que los tres servicios levantan.
3. Consultar `curl -i http://localhost:3000/api/players/1` y ver una respuesta 200.

### Secretos y datos fuera del repositorio

El `.env` con credenciales y la API key de Google no se versiona. `.env.sample` documenta cada variable sin valores reales. Los CSV tampoco se versionan, porque son archivos grandes que no se redistribuyen.

Para verificarlo:
1. Ejecutar `git check-ignore -v .env`.
2. Ejecutar `git check-ignore -v data/male_players-1.csv`, con la carpeta `data/` creada (si no existe, el comando no devuelve nada).
3. Ejecutar `git status` y confirmar que no aparece ninguno de los dos archivos.

### Versiones de runtime y motor de base de datos

**Decisión:** Node.js 26 (LTS activa) y MySQL 9.7 LTS, en lugar de Node.js 22 y MySQL 8.0. Quedan fijados en el `Dockerfile` y en `docker-compose.yml`, para que el proyecto se comporte igual en Windows y en otras máquinas.

**Alternativas consideradas:**
- Node.js 24 (mantenimiento LTS, seguridad hasta abril de 2028) y Node.js 22 (mantenimiento, seguridad hasta abril de 2027): descartadas por tener menos soporte que la 26.
- MySQL 8.4 LTS (soporte hasta abril de 2032): alternativa conservadora, descartada porque 9.7 LTS tiene soporte más largo.
- MySQL 26.10 (Innovation): la versión más nueva, descartada porque no es LTS y su soporte es corto.
- MySQL 8.0: descartada porque su soporte terminó el 30 de abril de 2026.

**Motivo:** MySQL 8.0 ya no recibe soporte y Node.js 22 está en mantenimiento. Se eligieron las LTS con soporte más largo. Además, MySQL 9 no habilita por defecto el plugin de autenticación `mysql_native_password`, por lo que se quitó la línea `command:` de `docker-compose.yml`.

**Cómo se verifica:**
1. `docker compose up -d --build` levanta `mysql_db`, `backend` y `frontend`.
2. `curl -i http://localhost:3000/api/players/1` responde 200 con JSON.
3. `curl -i http://localhost:3000/api/players/999999` responde 404.
4. `node -v` dentro del contenedor del backend devuelve `v26.x`.

Fuentes de fechas de soporte: endoflife.date (Node.js y MySQL) y el anuncio de MySQL de octubre de 2026.

### Finales de línea

Los archivos de texto se guardan con finales de línea LF, definidos en `.gitattributes`, porque los CRLF de Windows rompen los scripts de shell que corren dentro de los contenedores.

Para verificarlo:
1. Ejecutar `git ls-files --eol` y confirmar que no aparece `i/crlf` en el índice.

### Configuración de Sequelize y esquema

El puerto de la base se lee como número decimal con `parseInt(..., 10)`. El código base usaba `parseInt(..., 3306)`, que devuelve `NaN` porque 3306 no es una base numérica válida.

Los campos del modelo se declaran con `declare`. Sin esa palabra, TypeScript los inicializa en `undefined` y tapa los valores que devuelve la base, por eso la API mostraba skills en 0.

La conexión usa `utf8mb4` para soportar tildes, eñes y emojis. Esto evita nuevos errores de codificación, pero no corrige datos ya guardados mal: el nombre de Messi en el seed actual aparece como `AndrÃ©s`, y se corrige al cargar los datos con el importador.

`synchronize` está en `false`. La aplicación no modifica el esquema al arrancar. Los cambios de tabla se hacen con migraciones versionadas, que se pueden aplicar y revertir.

La CLI de migraciones usa `config/config.js` y `.sequelizerc`, separados de la configuración de la aplicación, porque la CLI corre con Node y no entiende TypeScript.

Para verificarlo:
1. Ejecutar `curl -i http://localhost:3000/api/players/1` y confirmar `speed: 93`, `shooting: 89`, `dribbling: 96` y `passing: 86`.
2. Ejecutar `curl -i http://localhost:3000/api/players/999999` y confirmar 404.
3. Ejecutar `npm run migrate` dentro del contenedor del backend y confirmar que termina sin errores.