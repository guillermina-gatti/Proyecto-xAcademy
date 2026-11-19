# Santex Academy - FootballAPI

**Guillermina Gatti** · Challenge XAcademy DEV 2026

[![CI](https://github.com/guillermina-gatti/Proyecto-xAcademy/actions/workflows/ci.yml/badge.svg)](https://github.com/guillermina-gatti/Proyecto-xAcademy/actions/workflows/ci.yml)

Aplicación web para gestionar jugadores de FIFA, de ambos géneros.

Este repositorio es un fork personal del proyecto base de SantexAcademy.

- **Backend:** Node.js 26, NestJS 11, Sequelize, MySQL 9.7
- **Frontend:** Angular 20, Chart.js (pendiente)
- **Infraestructura:** Docker Compose


## Requisitos previos

- Docker Desktop en Windows, con el backend WSL 2 habilitado (Settings → General → "Use the WSL 2 based engine").
- Git.
- Node.js 26, solo si querés correr el backend fuera de Docker.

## Pasos para correr

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/guillermina-gatti/Proyecto-xAcademy.git
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

### Un solo ORM: Sequelize

**Decisión:** Sequelize es el único ORM del backend. Se eliminan TypeORM, `@nestjs/typeorm` y el código que no se usaba.

**Alternativas consideradas:** mantener TypeORM junto a Sequelize. Descartado: dos ORMs sin uso aumentan las dependencias y no cumplen la consigna, que pide un ORM.

**Motivo:** la consigna pide un ORM (ejemplo Sequelize). El código de TypeORM no se ejecutaba.

**Cómo se verifica:**
1. `Get-ChildItem src -Recurse -File | Select-String -Pattern "typeorm"` dentro de `football-api\backend` no devuelve resultados.
2. `npm run build` termina sin errores.
3. `curl -i http://localhost:3000/api/players/1` responde 200 y `curl -i http://localhost:3000/api/players/999999` responde 404.

### Tests de integración contra MySQL real

**Decisión:** los tests e2e usan la base MySQL real, sin mocks, tanto en local como en GitHub Actions. El CI usa MySQL 9.7 y carga `football-api/docker/db/init.sql` al arrancar.

**Alternativas consideradas:** mockear el repositorio. Descartado: un mock no detecta errores de SQL ni de mapeo de Sequelize.

**Motivo:** la API depende de la base. Probar contra la base real detecta errores de conexión, consulta y datos.

**Cómo se verifica:**
1. En `football-api\backend`, `npm run test:e2e` pasa con MySQL levantado.
2. El workflow `CI` pasa en verde en la pestaña Actions de GitHub.
3. Prueba de falla: un error introducido a propósito hace fallar el CI, y al revertirlo vuelve a pasar.

### Esquema con migraciones: tabla base y columnas nuevas

**Decisión:** la tabla `players` se crea con una migración base (`20261119000001-create-players.js`) que usa `CREATE TABLE IF NOT EXISTS`, con las mismas columnas de `docker/db/init.sql`. La migración `20261119000002-players-fifa-columns.js` agrega las columnas nuevas.

**Alternativas consideradas:** quitar el seed de inmediato y crear la tabla sin `IF NOT EXISTS`. Descartado: con el seed todavía cargado, la migración fallaría en una base que ya tiene la tabla.

**Motivo:** las migraciones no deben depender del seed. Con `IF NOT EXISTS` conviven con `init.sql` hasta que se elimina el seed.

**Cómo se verifica:**
1. Base vacía: `npm run migrate` crea la tabla sin errores.
2. Base con seed: `npm run migrate` no pierde filas. `SELECT COUNT(*) FROM players;` da el mismo valor antes y después.
3. `npm run migrate:undo` y luego `npm run migrate` dejan el mismo estado.

Nota: el `down` de la migración base borra la tabla y sus datos. Revertirla no es seguro con datos cargados.

### Versión de FIFA como entero

**Decisión:** `fifa_version` pasa de `VARCHAR(255)` a `INT`. Se guarda el año de la edición en dos dígitos del CSV (`15` para FIFA 15, edición 2015).

**Alternativas consideradas:** mantener `VARCHAR`. Descartado: ordenar y filtrar por versión como texto da resultados incorrectos (por ejemplo, `9` queda después de `15`).

**Motivo:** la versión es un número. Permite filtrar `fifaVersion` de forma numérica en el listado y en la línea de tiempo.

**Cómo se verifica:** `SELECT DISTINCT fifa_version FROM players ORDER BY fifa_version;` devuelve números (`15`, `16`, ...).

### Género en la misma tabla

**Decisión:** la columna `gender` es un `ENUM('male','female','not_specified')` en la misma tabla `players`. Los datos de FIFA usan `male` o `female`. Los jugadores creados por el usuario pueden elegir `not_specified` ("Prefiero no decirlo") en el formulario.

**Alternativas consideradas:** una tabla separada por género. Descartado: las dos tablas tendrían las mismas columnas y el listado tendría que unirlas.

**Motivo:** una sola tabla mantiene el mismo listado, filtro y CSV para ambos géneros. El filtro por `gender` lo resuelve.

**Cómo se verifica:** `SELECT gender, COUNT(*) FROM players GROUP BY gender;` muestra solo los valores del enum.

### Identificador de FIFA (`fifa_player_id`)

**Decisión:** `fifa_player_id` se rellena desde `player_face_url`. El patrón `/players/200/911/...` da `200911`. Para Messi, la URL del seed es `/players/158/023/`, así que su valor es `158023`. Los jugadores creados por el usuario tendrán `fifa_version = 0` y un `fifa_player_id` desde `900001`, asignado por el servidor. La identidad de una fila es `(fifa_player_id, fifa_version, gender)`.

**Alternativas consideradas:** usar el `id` autoincremental como identidad entre ediciones. Descartado: el `id` cambia si se recarga la base, y el mismo jugador no tiene el mismo `id` en cada edición.

**Motivo:** `player_id` del CSV de FIFA identifica al jugador a lo largo de todas las ediciones. El número de la URL es ese mismo identificador.

**Cómo se verifica:** `SELECT fifa_player_id, fifa_version, gender FROM players WHERE id = 1;` devuelve `158023`. El backfill de la migración falla si queda algún jugador sin `fifa_player_id`.
### Identidad única de cada fila e índices de filtros

**Decisión:** la combinación `(fifa_player_id, fifa_version, gender)` es única. Una misma fila no puede repetirse para el mismo jugador, edición y género. Además se crean índices sobre `long_name`, `club_name` y `nationality_name`, que son los campos que filtra el listado. La migración busca duplicados antes de crear la clave única y falla con un mensaje claro si los hay.

**Alternativas consideradas:** validar la unicidad solo en la aplicación. Descartado: dos peticiones simultáneas podrían crear la misma fila, y la base no lo impediría.

**Motivo:** la base es la única que puede garantizar la unicidad. Los índices evitan que el filtro por nombre, club o nacionalidad recorra toda la tabla con 165.000 filas.

**Cómo se verifica:**
1. La consulta de duplicados devuelve cero filas: `SELECT fifa_player_id, fifa_version, gender, COUNT(*) c FROM players GROUP BY fifa_player_id, fifa_version, gender HAVING c > 1;`.
2. Insertar una copia de un jugador existente falla con `ERROR 1062 (23000): Duplicate entry`.
3. `SHOW INDEX FROM players;` muestra `uq_players_identity`, `idx_players_long_name`, `idx_players_club_name` e `idx_players_nationality_name`.
4. `npm run migrate:undo` elimina los índices y `npm run migrate` los vuelve a crear.