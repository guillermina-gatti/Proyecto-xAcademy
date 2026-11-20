# Santex Academy - FootballAPI

**Guillermina Gatti** · Challenge XAcademy DEV 2026

[![CI](https://github.com/guillermina-gatti/Proyecto-xAcademy/actions/workflows/ci.yml/badge.svg)](https://github.com/guillermina-gatti/Proyecto-xAcademy/actions/workflows/ci.yml)

Aplicación web para gestionar jugadores de FIFA, de ambos géneros, con ediciones de 2015 a 2023.

Este repositorio es un fork personal del proyecto base de SantexAcademy.

- **Backend:** Node.js 26, NestJS 11, Sequelize, MySQL 9.7, autenticación JWT con bcryptjs
- **Frontend:** Angular 21, Chart.js
- **Infraestructura:** Docker Compose

## Requisitos previos

- Docker Desktop en Windows, con el backend WSL 2 habilitado (Settings → General → "Use the WSL 2 based engine").
- Git.
- Node.js 26, solo si querés correr el backend o el frontend fuera de Docker.

## Pasos para correr

Todos los comandos de esta sección se ejecutan desde la carpeta `football-api`, donde está `docker-compose.yml`.

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/guillermina-gatti/Proyecto-xAcademy.git
   cd Proyecto-xAcademy/football-api
   ```

2. Copiar las variables de entorno del archivo de ejemplo al de ambiente. En PowerShell:

   ```powershell
   Copy-Item .env.sample .env
   ```

   En Linux o macOS:

   ```bash
   cp .env.sample .env
   ```

3. Completar en `.env`:
   - Las variables de MySQL y del backend, con los valores de `.env.sample`.
   - `JWT_SECRET`, obligatorio. Si falta, la aplicación no arranca. Se genera con un contenedor temporal, porque el backend todavía no está levantado:

     ```powershell
     docker run --rm node:26 node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```

   - `ADMIN_USER` (por defecto `admin`).
   - `GOOGLE_API_KEY` puede quedar vacía. Se obtiene en Google AI Studio (https://aistudio.google.com) y todavía no se usa.

   Nunca subas `.env` al repositorio.

4. Levantar los servicios:

   ```bash
   docker compose up -d --build
   docker compose logs -f backend
   ```

   La primera vez tarda varios minutos, porque descarga imágenes e instala dependencias. Esperá a ver `Nest application successfully started` y cortá los logs con Ctrl+C.

5. Generar el hash de la clave del admin, pegarlo en `ADMIN_PASSWORD_HASH` y reiniciar el backend (ver [Autenticación](#autenticación)):

   ```powershell
   docker compose exec -T backend node -e "console.log(require('bcryptjs').hashSync('TU_CLAVE', 10))"
   docker compose up -d --force-recreate backend
   ```

6. Importar los datos de FIFA (ver [Carga inicial de datos](#carga-inicial-de-datos)).

7. Abrir el frontend en http://localhost:4200. Sin sesión, la aplicación muestra el login; después de entrar, aparece la página de inicio.

| Servicio | URL |
|---|---|
| API | http://localhost:3000 |
| Frontend | http://localhost:4200 |
| MySQL | localhost:3306 |

### Autenticación

La API usa JWT. Todas las rutas de jugadores requieren un token, excepto `POST /api/auth/login`.

Las variables de autenticación están en `.env`:

- `JWT_SECRET`: obligatorio. Si falta, la aplicación no arranca. Se genera como en el paso 3 de [Pasos para correr](#pasos-para-correr).
- `ADMIN_USER`: usuario del admin (por defecto `admin`).
- `ADMIN_PASSWORD_HASH`: hash bcrypt de la clave del admin, entre comillas simples. La clave en texto plano nunca se guarda. Para generar el hash, con el backend levantado:

  ```powershell
  docker compose exec -T backend node -e "console.log(require('bcryptjs').hashSync('TU_CLAVE', 10))"
  ```

  Reemplazá `TU_CLAVE` por la clave que quieras usar y pegá el resultado en `ADMIN_PASSWORD_HASH`.

Después de cambiar `.env`, reiniciá el backend:

```powershell
docker compose up -d --force-recreate backend
```

Para obtener un token:

```powershell
$body = @{ username = 'admin'; password = 'TU_CLAVE' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body $body
```

La respuesta trae `accessToken`. Ese valor va en el header `Authorization: Bearer <token>` de cada petición.

### Carga inicial de datos

La base se llena con el importador de CSV. Los archivos CSV de FIFA no se versionan: se colocan en la carpeta `football-api/data/`, que está en `.gitignore`.

Los archivos deben llamarse `male_players.csv` y `female_players.csv`. Si se descargan desde el navegador, el nombre puede llevar un sufijo `-1` (por ejemplo, `male_players-1.csv`): renombrarlos antes de importar.

El backend ya aplicó las migraciones al arrancar, así que solo falta importar, primero los hombres y después las mujeres:

```powershell
docker compose exec backend npm run import:csv -- --file data/male_players.csv --gender male
docker compose exec backend npm run import:csv -- --file data/female_players.csv --gender female
```

El nombre del archivo puede ser cualquiera; lo que importa es el `--gender`. Repetir una importación no duplica filas: al terminar cada una se imprime cuántas filas se leyeron, guardaron y descartaron.

Con los archivos completos, el conteo por género tiene que dar 161.583 hombres y 4.131 mujeres:

```powershell
docker exec santex_academy_football_api_db mysql -uroot -proot football_db -e "SELECT gender, COUNT(*) FROM players GROUP BY gender;"
```

### Pruebas con Postman

En la carpeta `football-api/postman/` están la colección y el entorno.

1. En Postman, importá `postman/football-api.postman_collection.json` y `postman/football-api.postman_environment.json`.
2. Seleccioná el entorno **Football API - local**.
3. En el entorno, poné tu clave del admin en `password` (texto plano, no el hash). El archivo exportado tiene un valor de ejemplo: no lo cambies por la clave real en el archivo del repositorio.
4. Corré primero **Login correcto (200)**, para que se guarde el token en el entorno.
5. Ejecutá la colección completa con **Run**. Debe pasar sin errores.

Las requests de alta (POST) guardan `playerId`, y las de detalle y edición lo usan. Si las ejecutás sueltas o en otro orden, pueden fallar. La colección también asume los datos de prueba de `test/fixtures/` (por ejemplo, 32 jugadores en el listado), no los datos completos.

### Frontend

Con Docker, el frontend ya corre en http://localhost:4200 junto con el resto de los servicios.

Para correrlo fuera de Docker, desde `football-api/frontend`:

```powershell
npm install
npm start -- --port 4200
```

El puerto tiene que ser 4200: el backend solo acepta CORS desde `http://localhost:4200`. Si Angular usa otro puerto, el login falla con "No se pudo conectar con la API" aunque la API esté levantada.

Rutas del frontend:

| Ruta | Pantalla | Requiere sesión |
|---|---|---|
| `/login` | Inicio de sesión | No |
| `/` | Página de inicio | Sí |
| `/players` | Listado con filtros, paginación y descarga CSV | Sí |
| `/players/new` | Alta de jugador | Sí |
| `/players/:id` | Detalle con radar de skills | Sí |
| `/players/:id/edit` | Edición de jugador | Sí |

Cualquier ruta que no exista redirige a `/`, y sin sesión eso lleva a `/login`.

## Endpoints

Todas las rutas salvo `POST /api/auth/login` requieren el header `Authorization: Bearer <token>`. Sin token, o con un token inválido, responden 401.

| Método | Ruta | Auth | Respuestas |
|---|---|---|---|
| POST | `/api/auth/login` | No | 200 con `accessToken` · 400 sin `password` · 401 credenciales incorrectas |
| GET | `/api/players` | Sí | 200 con `{ data, meta }` · 400 parámetros inválidos |
| GET | `/api/players/export.csv` | Sí | 200 `text/csv` con descarga · 400 filtros inválidos |
| GET | `/api/players/:id` | Sí | 200 con el jugador · 400 id inválido · 404 no existe |
| POST | `/api/players` | Sí | 201 con el jugador creado · 400 validación |
| PATCH | `/api/players/:id` | Sí | 200 con el jugador editado · 400 validación o campo desconocido · 404 no existe |

Parámetros del listado y del CSV: `name`, `club`, `position`, `nationality`, `gender` (`male`, `female`, `not_specified`) y `fifaVersion`. Solo el listado acepta `page` y `limit`.

## Verificación

Con los servicios levantados y un token obtenido como se explica en [Autenticación](#autenticación):

```powershell
# Ver el rango de IDs que existen en la base.
# La contraseña es el valor de MYSQL_ROOT_PASSWORD en .env.
docker exec santex_academy_football_api_db mysql -uroot -proot football_db -e "SELECT MIN(id), MAX(id) FROM players;"

$body = @{ username = 'admin'; password = 'TU_CLAVE' } | ConvertTo-Json
$token = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -ContentType 'application/json' -Body $body).accessToken

# Reemplazar 1 por un ID real. Debe responder 200 con JSON
curl.exe -i -H "Authorization: Bearer $token" http://localhost:3000/api/players/1

# Un ID inexistente debe responder 404
curl.exe -i -H "Authorization: Bearer $token" http://localhost:3000/api/players/999999

# Sin token debe responder 401
curl.exe -i http://localhost:3000/api/players/1
```

En PowerShell usá `curl.exe` en lugar de `curl`.

### Tests

Los tests del backend usan los datos de prueba de `test/fixtures/` (20 hombres y 12 mujeres), no los datos completos. Si la base tiene los CSV completos, los conteos no coinciden y los tests e2e fallan. Para correrlos, primero reiniciá la base y cargá los fixtures:

```powershell
cd football-api
docker compose down -v
docker compose up -d --build
docker compose exec backend npm run import:csv -- --file test/fixtures/male_players_fixture.csv --gender male
docker compose exec backend npm run import:csv -- --file test/fixtures/female_players_fixture.csv --gender female
docker compose exec backend npm run test:e2e
docker compose exec backend npm run test -- csv-player-parser
```

Deben dar 49 casos e2e y 5 casos unitarios, todos en verde. Para volver a los datos completos después de los tests, repetí la importación de [Carga inicial de datos](#carga-inicial-de-datos).

Desde `football-api/frontend`:

```powershell
npm test -- --watch=false --browsers=ChromeHeadless
```

Debe dar 27 casos en verde.

### Reproducir desde cero

Para comprobar que el proyecto se levanta sin ayuda de la base de datos previa:

```powershell
cd football-api
docker compose down -v
docker compose up -d --build
docker compose logs -f backend
```

Después, con la clave del admin cargada en `.env` y los CSV en `data/`, correr la importación de [Carga inicial de datos](#carga-inicial-de-datos) y las verificaciones de arriba. Los resultados deben ser los mismos que antes del `down -v`.

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

Las decisiones están numeradas en el orden en que se tomaron, por commit. En las secciones siguientes, los comandos `curl` de "Cómo se verifica" asumen que ya tenés un token (ver [Autenticación](#autenticación)). Para las rutas de jugadores, agregá el header `Authorization: Bearer <token>`.

### D-01 · Fork del repositorio base

Usamos el fork del proyecto base de SantexAcademy en lugar de empezar de cero. La base ya trae Docker Compose, el backend en NestJS y el frontend en Angular, así que `docker compose up` funciona sin rearmar la infraestructura. Lo comprobamos levantando los tres servicios y consultando `GET /api/players/:id`.

Para verificarlo:
1. Ejecutar `docker compose up --build`.
2. Comprobar que los tres servicios levantan.
3. Consultar `curl -i http://localhost:3000/api/players/1` con token y ver una respuesta 200.

### D-02 · Secretos y datos fuera del repositorio

El `.env` con credenciales y la API key de Google no se versiona. `.env.sample` documenta cada variable sin valores reales. Los CSV tampoco se versionan, porque son archivos grandes que no se redistribuyen.

Para verificarlo:
1. Ejecutar `git check-ignore -v .env`.
2. Ejecutar `git check-ignore -v data/male_players.csv`, con la carpeta `data/` creada (si no existe, el comando no devuelve nada).
3. Ejecutar `git status` y confirmar que no aparece ninguno de los dos archivos.

### D-03 · Versiones de runtime y motor de base de datos

**Decisión:** Node.js 26 (LTS activa) y MySQL 9.7 LTS, en lugar de Node.js 22 y MySQL 8.0. Quedan fijados en el `Dockerfile` y en `docker-compose.yml`, para que el proyecto se comporte igual en Windows y en otras máquinas.

**Alternativas consideradas:**
- Node.js 24 (mantenimiento LTS, seguridad hasta abril de 2028) y Node.js 22 (mantenimiento, seguridad hasta abril de 2027): descartadas por tener menos soporte que la 26.
- MySQL 8.4 LTS (soporte hasta abril de 2032): alternativa conservadora, descartada porque 9.7 LTS tiene soporte más largo.
- MySQL 26.10 (Innovation): la versión más nueva, descartada porque no es LTS y su soporte es corto.
- MySQL 8.0: descartada porque su soporte terminó el 30 de abril de 2026.

**Motivo:** MySQL 8.0 ya no recibe soporte y Node.js 22 está en mantenimiento. Se eligieron las LTS con soporte más largo. Además, MySQL 9 no habilita por defecto el plugin de autenticación `mysql_native_password`, por lo que se quitó la línea `command:` de `docker-compose.yml`.

**Cómo se verifica:**
1. `docker compose up -d --build` levanta `mysql_db`, `backend` y `frontend`.
2. `curl -i` sobre `/api/players/1` con token responde 200 con JSON.
3. `curl -i` sobre `/api/players/999999` con token responde 404.
4. `node -v` dentro del contenedor del backend devuelve `v26.x`.

Fuentes de fechas de soporte: endoflife.date (Node.js y MySQL) y el anuncio de MySQL de octubre de 2026.

### D-04 · Finales de línea

Los archivos de texto se guardan con finales de línea LF, definidos en `.gitattributes`, porque los CRLF de Windows rompen los scripts de shell que corren dentro de los contenedores.

Para verificarlo:
1. Ejecutar `git ls-files --eol` y confirmar que no aparece `i/crlf` en el índice.

### D-05 · Configuración de Sequelize y esquema

El puerto de la base se lee como número decimal con `parseInt(..., 10)`. El código base usaba `parseInt(..., 3306)`, que devuelve `NaN` porque 3306 no es una base numérica válida.

Los campos del modelo se declaran con `declare`. Sin esa palabra, TypeScript los inicializa en `undefined` y tapa los valores que devuelve la base, por eso la API mostraba skills en 0.

La conexión usa `utf8mb4` para soportar tildes, eñes y emojis. Esto evita nuevos errores de codificación, pero no corrige datos ya guardados mal. El importador también corrige los nombres con mojibake al leer el CSV, por ejemplo `AndrÃ©s` por `Andrés`.

`synchronize` está en `false`. La aplicación no modifica el esquema al arrancar. Los cambios de tabla se hacen con migraciones versionadas, que se pueden aplicar y revertir.

La CLI de migraciones usa `config/config.js` y `.sequelizerc`, separados de la configuración de la aplicación, porque la CLI corre con Node y no entiende TypeScript.

Para verificarlo:
1. Ejecutar `curl -i` sobre `/api/players/1` con token y confirmar `speed: 93`, `shooting: 89`, `dribbling: 96` y `passing: 86`.
2. Ejecutar `curl -i` sobre `/api/players/999999` con token y confirmar 404.
3. Ejecutar `npm run migrate` dentro del contenedor del backend y confirmar que termina sin errores.

### D-06 · Un solo ORM: Sequelize

**Decisión:** Sequelize es el único ORM del backend. Se eliminan TypeORM, `@nestjs/typeorm` y el código que no se usaba.

**Alternativas consideradas:** mantener TypeORM junto a Sequelize. Descartado: dos ORMs sin uso aumentan las dependencias y no cumplen la consigna, que pide un ORM.

**Motivo:** la consigna pide un ORM (ejemplo Sequelize). El código de TypeORM no se ejecutaba.

**Cómo se verifica:**
1. `Get-ChildItem src -Recurse -File | Select-String -Pattern "typeorm"` dentro de `football-api\backend` no devuelve resultados.
2. `npm run build` termina sin errores.
3. `curl -i` sobre `/api/players/1` con token responde 200 y `/api/players/999999` responde 404.

### D-07 · Tests de integración contra MySQL real

**Decisión:** los tests e2e usan la base MySQL real, sin mocks, tanto en local como en GitHub Actions. El CI usa MySQL 9.7, aplica las migraciones e importa los fixtures de `test/fixtures/` antes de correr los tests.

**Alternativas consideradas:** mockear el repositorio. Descartado: un mock no detecta errores de SQL ni de mapeo de Sequelize.

**Motivo:** la API depende de la base. Probar contra la base real detecta errores de conexión, consulta y datos.

**Cómo se verifica:**
1. En `football-api\backend`, `npm run test:e2e` pasa con MySQL levantado y los fixtures cargados.
2. El workflow `CI` pasa en verde en la pestaña Actions de GitHub.
3. Prueba de falla: un error introducido a propósito hace fallar el CI, y al revertirlo vuelve a pasar.

### D-08 · Esquema con migraciones: tabla base y columnas nuevas

**Decisión:** la tabla `players` se crea con una migración base (`20261119000001-create-players.js`) que usa `CREATE TABLE IF NOT EXISTS`, con las columnas base de los jugadores. La migración `20261119000002-players-fifa-columns.js` agrega las columnas nuevas.

**Alternativas consideradas:** crear la tabla sin `IF NOT EXISTS`. Descartado: la migración fallaría en una base que ya tiene la tabla.

**Motivo:** las migraciones no deben depender de datos cargados a mano. Con `IF NOT EXISTS` la migración es segura en bases que ya tienen la tabla.

**Cómo se verifica:**
1. Base vacía: `npm run migrate` crea la tabla sin errores.
2. Base con datos: `npm run migrate` no pierde filas. `SELECT COUNT(*) FROM players;` da el mismo valor antes y después.
3. `npm run migrate:undo` y luego `npm run migrate` dejan el mismo estado.

Nota: el `down` de la migración base borra la tabla y sus datos. Revertirla no es seguro con datos cargados.

### D-09 · Versión de FIFA como entero

**Decisión:** `fifa_version` pasa de `VARCHAR(255)` a `INT`. Se guarda el año de la edición en dos dígitos del CSV (`15` para FIFA 15, edición 2015).

**Alternativas consideradas:** mantener `VARCHAR`. Descartado: ordenar y filtrar por versión como texto da resultados incorrectos (por ejemplo, `9` queda después de `15`).

**Motivo:** la versión es un número. Permite filtrar `fifaVersion` de forma numérica en el listado y en la línea de tiempo.

**Cómo se verifica:** `SELECT DISTINCT fifa_version FROM players ORDER BY fifa_version;` devuelve números (`15`, `16`, ...).

### D-10 · Género en la misma tabla

**Decisión:** la columna `gender` es un `ENUM('male','female','not_specified')` en la misma tabla `players`. Los datos de FIFA usan `male` o `female`. Los jugadores creados por el usuario pueden elegir `not_specified` ("Prefiero no decirlo") en el formulario.

**Alternativas consideradas:** una tabla separada por género. Descartado: las dos tablas tendrían las mismas columnas y el listado tendría que unirlas.

**Motivo:** una sola tabla mantiene el mismo listado, filtro y CSV para ambos géneros. El filtro por `gender` lo resuelve.

**Cómo se verifica:** `SELECT gender, COUNT(*) FROM players GROUP BY gender;` muestra solo los valores del enum.

### D-11 · Identificador de FIFA (`fifa_player_id`)

**Decisión:** `fifa_player_id` se rellena desde `player_face_url`. El patrón `/players/200/911/...` da `200911`. Para Messi, la URL del CSV es `/players/158/023/`, así que su valor es `158023`. Los jugadores creados por el usuario tendrán `fifa_version = 0` y un `fifa_player_id` desde `900001`, asignado por el servidor. La identidad de una fila es `(fifa_player_id, fifa_version, gender)`.

**Alternativas consideradas:** usar el `id` autoincremental como identidad entre ediciones. Descartado: el `id` cambia si se recarga la base, y el mismo jugador no tiene el mismo `id` en cada edición.

**Motivo:** `player_id` del CSV de FIFA identifica al jugador a lo largo de todas las ediciones. El número de la URL es ese mismo identificador.

**Cómo se verifica:** `SELECT fifa_player_id, fifa_version, gender FROM players WHERE id = 1;` devuelve `158023`. El backfill de la migración falla si queda algún jugador sin `fifa_player_id`.

### D-12 · Identidad única de cada fila e índices de filtros

**Decisión:** la combinación `(fifa_player_id, fifa_version, gender)` es única. Una misma fila no puede repetirse para el mismo jugador, edición y género. Además se crean índices sobre `long_name`, `club_name` y `nationality_name`, que son los campos que filtra el listado. La migración busca duplicados antes de crear la clave única y falla con un mensaje claro si los hay.

**Alternativas consideradas:** validar la unicidad solo en la aplicación. Descartado: dos peticiones simultáneas podrían crear la misma fila, y la base no lo impediría.

**Motivo:** la base es la única que puede garantizar la unicidad. Los índices evitan que el filtro por nombre, club o nacionalidad recorra toda la tabla con más de 165.000 filas.

**Cómo se verifica:**
1. La consulta de duplicados devuelve cero filas: `SELECT fifa_player_id, fifa_version, gender, COUNT(*) c FROM players GROUP BY fifa_player_id, fifa_version, gender HAVING c > 1;`.
2. Insertar una copia de un jugador existente falla con `ERROR 1062 (23000): Duplicate entry`.
3. `SHOW INDEX FROM players;` muestra `uq_players_identity`, `idx_players_long_name`, `idx_players_club_name` e `idx_players_nationality_name`.
4. `npm run migrate:undo` elimina los índices y `npm run migrate` los vuelve a crear.

### D-13 · Importador de CSV idempotente

**Decisión:** la carga se hace con un script de línea de comandos (`npm run import:csv`) que lee el CSV en streaming y escribe en lotes de 1000 filas con upsert (`bulkCreate` con `updateOnDuplicate`) sobre la clave única `(fifa_player_id, fifa_version, gender)`. El CSV femenino trae varias filas por edición, así que antes de escribir se conserva solo la de `fifa_update` más reciente para cada `(fifa_player_id, fifa_version)`.

**Alternativas consideradas:** un seed SQL (descartado: un dump de 25 MB en el repositorio y no resuelve la regla de dedupe por género); cargar el CSV completo en memoria (descartado: el femenino tiene 181.361 filas con 110 columnas); insertar sin upsert (descartado: repetir la carga duplicaría filas o fallaría por la clave única).

**Motivo:** el streaming y los lotes mantienen el consumo de memoria bajo con archivos de decenas de MB. El upsert hace que la carga se pueda repetir sin efectos secundarios.

**Resultados medidos con los CSV completos:**
- Masculino: 161.583 filas leídas, 161.583 importadas, 0 descartadas.
- Femenino: 181.361 filas leídas, 4.131 importadas, 0 descartadas. La diferencia se debe a la regla de dedupe por edición.

**Cómo se verifica:**
1. `npm run test -- csv-player-parser` pasa en el backend.
2. Tras importar el masculino, `SELECT COUNT(*) FROM players WHERE gender = 'male';` devuelve 161.583.
3. Tras importar el femenino, `SELECT COUNT(*) FROM players WHERE gender = 'female';` devuelve 4.131.
4. Repetir las dos importaciones no cambia esos conteos.
5. `SELECT id, fifa_version FROM players WHERE fifa_player_id = 158023;` devuelve varias ediciones de Messi.

### D-14 · Paginación y filtros del listado

**Decisión:** `GET /api/players` pagina por offset (`page` y `limit`) y responde `{ data, meta }`. Los filtros `name`, `club`, `position` y `nationality` son búsquedas parciales sin distinguir mayúsculas. `gender` y `fifaVersion` son coincidencia exacta. Los resultados se ordenan por `id` para que páginas consecutivas no repitan jugadores.

**Alternativas consideradas:** paginación por cursor (descartada: más compleja y el listado no necesita navegación en tiempo real); límite sin máximo (descartado: una petición podía devolver miles de filas).

**Motivo:** offset es suficiente para el volumen de datos del proyecto, y la respuesta es fácil de consumir desde Angular. El máximo de 100 por página protege la API.

**Cómo se verifica:**
1. `GET /api/players?page=1&limit=5` devuelve 5 jugadores y `meta.total` 32 con los fixtures cargados.
2. Páginas consecutivas no repiten ids.
3. `page=0`, `limit=abc` y `limit=1000` devuelven 400.
4. `npm run test:e2e` pasa.

### D-15 · Alta, edición y validaciones de jugadores

**Decisión:** `GET /api/players/:id` devuelve el detalle del jugador con los campos principales (identificación, versión, género, calificación, potencial, edad, valor, salario, altura, peso, pie, skills principales). `POST /api/players` crea un jugador propio: `fifa_version` queda en `0` y `fifa_player_id` toma el siguiente valor desde `900001`. `PATCH /api/players/:id` edita de forma parcial: solo cambia los campos enviados. El género no se edita después del alta. Las validaciones están en class-validator con un `ValidationPipe` global que rechaza campos desconocidos (`forbidNonWhitelisted`) con 400.

**Alternativas consideradas:** `PUT` con reemplazo completo (descartado: obliga a reenviar todo el jugador para cambiar un campo); devolver los ~90 columnas del registro en el detalle (descartado por ahora: los sub-atributos detallados quedan para una mejora posterior, el radar usa solo los seis skills principales); permitir editar el género (descartado: no lo pide la consigna y no aporta al mínimo).

**Motivo:** PATCH coincide con la consigna de "modificar la información" sin obligar a reenviar todo. Los rangos 0 a 99 son los de FIFA. Las pruebas corren con `--runInBand` porque los POST insertan filas y el listado cuenta 32 jugadores con los fixtures.

**Límite conocido:** dos altas simultáneas pueden pedir el mismo `fifa_player_id` y una de ellas fallar con 500. Para el alcance del challenge se acepta; la solución sería un reintento o una transacción con bloqueo.

**Cómo se verifica:**
1. `GET /api/players/1` devuelve `fifaPlayerId` 158023 y `gender` male.
2. `POST /api/players` con nombre y skills responde 201 con `fifaVersion` 0 y `fifaPlayerId` desde 900001.
3. Un `POST` con skill 100, nombre vacío o género fuera de la lista responde 400.
4. `PATCH` cambia solo lo enviado y responde 200; `PATCH` a un id inexistente responde 404; un campo desconocido responde 400.
5. `npm run test:e2e` pasa completo.

### D-16 · Exportar el listado filtrado a CSV

**Decisión:** `GET /api/players/export.csv` acepta los mismos filtros que el listado (`name`, `club`, `position`, `nationality`, `gender`, `fifaVersion`) y devuelve todas las filas que coinciden, sin paginación. La respuesta es `text/csv; charset=utf-8` con `Content-Disposition: attachment; filename="players.csv"`. El archivo empieza con BOM UTF-8 para que Excel muestre bien las tildes y la eñe. Los valores que empiezan con `=`, `+`, `-` o `@` se prefijan con una comilla simple para que Excel no los ejecute como fórmulas.

**Alternativas consideradas:** generar el archivo completo en memoria y responderlo de una vez (descartado: el listado completo son más de 165.000 filas); paginar la exportación (descartado: un CSV paginado obliga al usuario a unir archivos); exportar en XLSX (descartado por ahora: la consigna pide CSV y el hint de XLSX es opcional).

**Motivo:** la lectura se hace en lotes de 1.000 filas por clave `id` (keyset), así que la memoria se mantiene baja y cada lote se escribe antes de leer el siguiente. La ruta `export.csv` se declara antes de `:id`, porque si no, responde 400.

**Límite conocido:** si la base falla a mitad de la exportación, el archivo queda cortado y el cliente no recibe un error explícito, porque las cabeceras ya se enviaron.

**Cómo se verifica:**
1. `GET /api/players/export.csv` con token responde 200 con `Content-Type: text/csv` y `Content-Disposition` de descarga.
2. `GET /api/players/export.csv?gender=female` tiene 13 líneas (12 jugadores y la cabecera), igual que `meta.total` del listado con el mismo filtro más una, con los fixtures cargados.
3. `?page=2` y `?gender=otro` responden 400.
4. `npm run test:e2e` pasa completo.

### D-17 · Autenticación con JWT y contraseña hasheada

**Decisión:** el login es `POST /api/auth/login` con `username` y `password`. Devuelve un `accessToken` JWT. Un guard global exige el token en todas las rutas, salvo las marcadas con `@Public()`. La contraseña del admin no se guarda en texto plano: `ADMIN_PASSWORD_HASH` contiene el hash bcrypt, y el backend lo compara con `bcryptjs`. Si falta `JWT_SECRET`, la aplicación no arranca.

**Alternativas consideradas:**
- Usuario y contraseña en texto plano en `.env`: descartado, la clave quedaría visible en el archivo y en cualquier copia del entorno.
- Sesiones con cookie de servidor: descartado, obliga a guardar estado en el backend y complica el consumo desde Angular.
- Librería `bcrypt` nativa: descartada por ahora, porque requiere compilar el módulo dentro de la imagen de Docker. `bcryptjs` es JavaScript puro y genera hashes `$2b$` compatibles.

**Motivo:** la consigna pide que la API tenga autenticación. Con un solo usuario admin alcanza, y el hash evita guardar la clave.

**Cómo se verifica:**
1. Sin token, `curl -i http://localhost:3000/api/players/1` responde 401.
2. `POST /api/auth/login` con clave incorrecta responde 401; sin `password`, responde 400.
3. `POST /api/auth/login` con la clave correcta responde 200 con `accessToken`.
4. Con el token en el header, `GET /api/players/1` responde 200.
5. `npm run test:e2e` pasa, incluyendo los tests de `auth.e2e-spec.ts`.

### D-18 · Estructura del frontend y sesión en el cliente

**Decisión:** el frontend usa rutas con un guard, un interceptor HTTP para el token y un servicio de autenticación. El token se guarda en `localStorage`. La URL de la API vive en `src/environments/environment.ts`. La pantalla de login usa reactive forms. Todas las pantallas, salvo el login, están protegidas por el guard: sin sesión, cualquier ruta lleva a `/login`.

**Alternativas consideradas:** guardar el token en una cookie HttpOnly. Descartado: requiere que el backend emita cookies y maneje CSRF, y el backend ya devuelve el token en el cuerpo de la respuesta.

**Motivo:** el backend usa JWT en el header `Authorization`. Con un interceptor, todas las llamadas a la API lo envían sin que cada componente lo sepa. Un 401 de la API cierra la sesión y lleva a `/login`.

**Restricción de puerto:** el backend solo acepta CORS desde `http://localhost:4200`. El frontend tiene que correr en ese puerto (`npm start -- --port 4200`). Si Angular usa otro puerto, el login falla con "No se pudo conectar con la API" aunque la API esté levantada.

**Cómo se verifica:**
1. Sin sesión, `/` y `/players` redirigen a `/login`.
2. Un login correcto guarda el token en `localStorage` y navega a la página de inicio.
3. Un 401 de la API cierra la sesión.
4. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.

### D-19 · Listado de jugadores en el frontend

**Decisión:** `/players` muestra el listado con filtros (nombre, club, posición, nacionalidad, género y versión), paginación de 20 en 20 y descarga CSV. Los filtros y la página viven en la URL, así que recargar o compartir el link conserva la búsqueda. Cada nombre es un enlace al detalle del jugador.

**Alternativas consideradas:** descargar el CSV con un `<a href>` directo. Descartado: el navegador no envía el header `Authorization`, así que la API respondería 401. La descarga se hace con `HttpClient` como `blob` y se guarda desde el cliente.

**Motivo:** los filtros en la URL permiten volver atrás y compartir búsquedas, y el blob mantiene la autenticación en todas las llamadas.

**Límite conocido:** la tabla del listado no muestra género ni versión, porque el endpoint del listado no devuelve esos campos. Se pueden filtrar, pero no se ven en cada fila. Agregarlos requiere ampliar `PlayerListItem` en el backend, y queda como mejora posterior.

**Cómo se verifica:**
1. En `/players`, cada filtro cambia el listado y la URL.
2. Paginar no repite jugadores y "Anterior" está deshabilitado en la página 1.
3. "Descargar CSV" baja `players.csv` con los mismos filtros que la pantalla.
4. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.

### D-20 · Detalle del jugador con radar de skills

**Decisión:** `/players/:id` muestra los datos principales del jugador, un radar con seis skills (velocidad, tiro, pase, regate, defensa y físico) y barras de atributos. El gráfico usa Chart.js y se destruye al salir de la pantalla. Los nombres de los skills coinciden con los campos de la API. El color de cada barra depende del valor: verde desde 85, amarillo desde 70, y rosa por debajo.

**Alternativas consideradas:** mostrar los sub-atributos detallados (más de 30 valores) en el radar. Descartado: el radar pierde lectura con tantos ejes, y el detalle queda para una mejora posterior.

**Motivo:** seis ejes muestran el perfil del jugador de un vistazo. Un ID inexistente responde con un mensaje de 404 en la pantalla, sin gráfico.

**Cómo se verifica:**
1. Desde el listado, hacer click en un nombre abre `/players/:id` con el radar y las barras.
2. `/players/999999` muestra "Jugador no encontrado" y no dibuja el gráfico.
3. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.

### D-21 · Formularios de alta y edición

**Decisión:** `/players/new` crea un jugador y `/players/:id/edit` lo edita, con reactive forms. Las validaciones del cliente replican las del backend: nombre y posición obligatorios con largo máximo, rating obligatorio y skills enteros entre 0 y 99. El formulario no envía datos inválidos, y los errores 400 del backend se muestran sobre el formulario. En edición, el género aparece con su valor actual y deshabilitado, porque la API no lo permite cambiar.

**Alternativas consideradas:** un solo formulario sin validación en el cliente, dejando que el backend responda 400. Descartado: el usuario tendría que enviar y corregir a ciegas. Un `PUT` con reemplazo completo: descartado porque el backend usa PATCH para edición parcial.

**Motivo:** el alta y la edición comparten el mismo componente, y la diferencia es solo la presencia del `id` en la ruta. El género se elige al crear y no se edita, igual que en la API.

**Cómo se verifica:**
1. Enviar el formulario de alta vacío no hace ninguna petición y muestra los mensajes de campo.
2. Crear un jugador lo muestra en el listado y navega a su detalle.
3. Editar un jugador cambia los valores en el detalle, y el género aparece deshabilitado.
4. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.

### D-22 · Diseño visual y navegación

**Decisión:** la interfaz usa fondo blanco, bordes negros finos y esquinas rectas, con los colores verde, rosa, amarillo y azul como acentos. Las etiquetas y los datos técnicos van en tipografía monoespaciada, y los subtítulos en serif itálica. La página de inicio aparece solo con sesión, y en la barra superior hay un reloj que se actualiza cada segundo. Los colores y tipografías están como variables CSS en `src/styles.css`, así que se pueden cambiar sin tocar los componentes.

**Alternativas consideradas:**
- Fondo crema o arenoso: descartado, porque el contraste con el texto y las tarjetas no quedaba limpio.
- Una biblioteca de componentes como Angular Material: descartada, porque agrega peso al bundle y el diseño pedido es propio, con formas y colores específicos.

**Motivo:** un lenguaje visual único hace que el listado, el detalle y el formulario se lean como una misma aplicación. El color del rating ayuda a comparar jugadores de un vistazo.

**Cómo se verifica:**
1. Sin sesión, `/` redirige a `/login`. Con sesión, `/` muestra la página de inicio.
2. El reloj de la barra superior cambia cada segundo.
3. Los ratings de 85 o más aparecen en verde, de 70 a 84 en amarillo y los menores en rosa.
4. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.
