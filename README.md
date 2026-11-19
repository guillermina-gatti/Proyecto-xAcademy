# Santex Academy - FootballAPI

**Guillermina Gatti** · Challenge XAcademy DEV 2026

[![CI](https://github.com/guillermina-gatti/Proyecto-xAcademy/actions/workflows/ci.yml/badge.svg)](https://github.com/guillermina-gatti/Proyecto-xAcademy/actions/workflows/ci.yml)

Aplicación web para gestionar jugadores de FIFA, de ambos géneros.

Este repositorio es un fork personal del proyecto base de SantexAcademy.

- **Backend:** Node.js 26, NestJS 11, Sequelize, MySQL 9.7, autenticación JWT con bcryptjs
- **Frontend:** Angular 21, Chart.js (pendiente)
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

5. Generar los secretos de autenticación (ver [Autenticación](#autenticación)).

6. Levantar todo:

   ```bash
   docker compose up --build
   ```

   La primera vez tarda varios minutos, porque descarga imágenes e instala dependencias. Después alcanza con `docker compose up`.

| Servicio | URL |
|---|---|
| API | http://localhost:3000 |
| Frontend | http://localhost:4200 |
| MySQL | localhost:3306 |

### Autenticación

La API usa JWT. Todas las rutas de jugadores requieren un token, excepto `POST /api/auth/login`.

Las variables de autenticación están en `.env`:

- `JWT_SECRET`: obligatorio. Si falta, la aplicación no arranca. Generalo con:

  ```powershell
  docker compose exec -T backend node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- `ADMIN_USER`: usuario del admin (por defecto `admin`).
- `ADMIN_PASSWORD_HASH`: hash bcrypt de la clave del admin, entre comillas simples. La clave en texto plano nunca se guarda. Para generar el hash:

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

La base se llena con el importador de CSV. Los archivos CSV de FIFA no se versionan: se colocan en la carpeta `football-api/data/`, que está en `.gitignore`. El backend ya aplicó las migraciones al arrancar, así que solo falta importar, primero los hombres y después las mujeres:

```bash
cd football-api
docker compose exec backend npm run import:csv -- --file data/male_players.csv --gender male
docker compose exec backend npm run import:csv -- --file data/female_players.csv --gender female
```

El nombre del archivo puede ser cualquiera; lo que importa es el `--gender`. Repetir una importación no duplica filas: al terminar cada una se imprime cuántas filas se leyeron, guardaron y descartaron.

### Pruebas con Postman

En la carpeta `football-api/postman/` están la colección y el entorno.

1. En Postman, importá `postman/football-api.postman_collection.json` y `postman/football-api.postman_environment.json`.
2. Seleccioná el entorno **Football API - local**.
3. En el entorno, poné tu clave del admin en `password` (texto plano, no el hash). El archivo exportado tiene un valor de ejemplo: no lo cambies por la clave real en el archivo del repositorio.
4. Corré primero **Login correcto (200)**, para que se guarde el token en el entorno.
5. Ejecutá la colección completa con **Run**. Debe pasar sin errores.

Las requests de alta (POST) guardan `playerId`, y las de detalle y edición lo usan. Si las ejecutás sueltas o en otro orden, pueden fallar.

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

En las secciones siguientes, los comandos `curl` de "Cómo se verifica" asumen que ya tenés un token (ver [Autenticación](#autenticación)). Para las rutas de jugadores, agregá el header `Authorization: Bearer <token>`.

### Fork del repositorio base

Usamos el fork del proyecto base de SantexAcademy en lugar de empezar de cero. La base ya trae Docker Compose, el backend en NestJS y el frontend en Angular, así que `docker compose up` funciona sin rearmar la infraestructura. Lo comprobamos levantando los tres servicios y consultando `GET /api/players/:id`.

Para verificarlo:
1. Ejecutar `docker compose up --build`.
2. Comprobar que los tres servicios levantan.
3. Consultar `curl -i http://localhost:3000/api/players/1` con token y ver una respuesta 200.

### Secretos y datos fuera del repositorio

El `.env` con credenciales y la API key de Google no se versiona. `.env.sample` documenta cada variable sin valores reales. Los CSV tampoco se versionan, porque son archivos grandes que no se redistribuyen.

Para verificarlo:
1. Ejecutar `git check-ignore -v .env`.
2. Ejecutar `git check-ignore -v data/male_players-1.csv`, con la carpeta `data/` creada (si no existe, el comando no devuelve nada).
3. Ejecutar `git status` y confirmar que no aparece ninguno de los dos archivos.

### Autenticación con JWT y contraseña hasheada

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

### Configuración de Sequelize y esquema

El puerto de la base se lee como número decimal con `parseInt(..., 10)`. El código base usaba `parseInt(..., 3306)`, que devuelve `NaN` porque 3306 no es una base numérica válida.

Los campos del modelo se declaran con `declare`. Sin esa palabra, TypeScript los inicializa en `undefined` y tapa los valores que devuelve la base, por eso la API mostraba skills en 0.

La conexión usa `utf8mb4` para soportar tildes, eñes y emojis. Esto evita nuevos errores de codificación, pero no corrige datos ya guardados mal. El importador también corrige los nombres con mojibake al leer el CSV, por ejemplo `AndrÃ©s` por `Andrés`.

`synchronize` está en `false`. La aplicación no modifica el esquema al arrancar. Los cambios de tabla se hacen con migraciones versionadas, que se pueden aplicar y revertir.

La CLI de migraciones usa `config/config.js` y `.sequelizerc`, separados de la configuración de la aplicación, porque la CLI corre con Node y no entiende TypeScript.

Para verificarlo:
1. Ejecutar `curl -i` sobre `/api/players/1` con token y confirmar `speed: 93`, `shooting: 89`, `dribbling: 96` y `passing: 86`.
2. Ejecutar `curl -i` sobre `/api/players/999999` con token y confirmar 404.
3. Ejecutar `npm run migrate` dentro del contenedor del backend y confirmar que termina sin errores.

### Un solo ORM: Sequelize

**Decisión:** Sequelize es el único ORM del backend. Se eliminan TypeORM, `@nestjs/typeorm` y el código que no se usaba.

**Alternativas consideradas:** mantener TypeORM junto a Sequelize. Descartado: dos ORMs sin uso aumentan las dependencias y no cumplen la consigna, que pide un ORM.

**Motivo:** la consigna pide un ORM (ejemplo Sequelize). El código de TypeORM no se ejecutaba.

**Cómo se verifica:**
1. `Get-ChildItem src -Recurse -File | Select-String -Pattern "typeorm"` dentro de `football-api\backend` no devuelve resultados.
2. `npm run build` termina sin errores.
3. `curl -i` sobre `/api/players/1` con token responde 200 y `/api/players/999999` responde 404.

### Tests de integración contra MySQL real

**Decisión:** los tests e2e usan la base MySQL real, sin mocks, tanto en local como en GitHub Actions. El CI usa MySQL 9.7, aplica las migraciones e importa los fixtures de `test/fixtures/` antes de correr los tests.

**Alternativas consideradas:** mockear el repositorio. Descartado: un mock no detecta errores de SQL ni de mapeo de Sequelize.

**Motivo:** la API depende de la base. Probar contra la base real detecta errores de conexión, consulta y datos.

**Cómo se verifica:**
1. En `football-api\backend`, `npm run test:e2e` pasa con MySQL levantado.
2. El workflow `CI` pasa en verde en la pestaña Actions de GitHub.
3. Prueba de falla: un error introducido a propósito hace fallar el CI, y al revertirlo vuelve a pasar.

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
2. `curl -i` sobre `/api/players/1` con token responde 200 con JSON.
3. `curl -i` sobre `/api/players/999999` con token responde 404.
4. `node -v` dentro del contenedor del backend devuelve `v26.x`.

Fuentes de fechas de soporte: endoflife.date (Node.js y MySQL) y el anuncio de MySQL de octubre de 2026.

### Finales de línea

Los archivos de texto se guardan con finales de línea LF, definidos en `.gitattributes`, porque los CRLF de Windows rompen los scripts de shell que corren dentro de los contenedores.

Para verificarlo:
1. Ejecutar `git ls-files --eol` y confirmar que no aparece `i/crlf` en el índice.

### Esquema con migraciones: tabla base y columnas nuevas

**Decisión:** la tabla `players` se crea con una migración base (`20261119000001-create-players.js`) que usa `CREATE TABLE IF NOT EXISTS`, con las columnas base de los jugadores. La migración `20261119000002-players-fifa-columns.js` agrega las columnas nuevas.

**Alternativas consideradas:** crear la tabla sin `IF NOT EXISTS`. Descartado: la migración fallaría en una base que ya tiene la tabla.

**Motivo:** las migraciones no deben depender de datos cargados a mano. Con `IF NOT EXISTS` la migración es segura en bases que ya tienen la tabla.

**Cómo se verifica:**
1. Base vacía: `npm run migrate` crea la tabla sin errores.
2. Base con datos: `npm run migrate` no pierde filas. `SELECT COUNT(*) FROM players;` da el mismo valor antes y después.
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

**Decisión:** `fifa_player_id` se rellena desde `player_face_url`. El patrón `/players/200/911/...` da `200911`. Para Messi, la URL del CSV es `/players/158/023/`, así que su valor es `158023`. Los jugadores creados por el usuario tendrán `fifa_version = 0` y un `fifa_player_id` desde `900001`, asignado por el servidor. La identidad de una fila es `(fifa_player_id, fifa_version, gender)`.

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

### Importador de CSV idempotente

**Decisión:** la carga se hace con un script de línea de comandos (`npm run import:csv`) que lee el CSV en streaming y escribe en lotes de 1000 filas con upsert (`bulkCreate` con `updateOnDuplicate`) sobre la clave única `(fifa_player_id, fifa_version, gender)`. El CSV femenino trae varias filas por edición, así que antes de escribir se conserva solo la de `fifa_update` más reciente para cada `(fifa_player_id, fifa_version)`.

**Alternativas consideradas:** un seed SQL (descartado: un dump de 25 MB en el repositorio y no resuelve la regla de dedupe por género); cargar el CSV completo en memoria (descartado: el femenino tiene 181.361 filas con 110 columnas); insertar sin upsert (descartado: repetir la carga duplicaría filas o fallaría por la clave única).

**Motivo:** el streaming y los lotes mantienen el consumo de memoria bajo con archivos de cientos de MB. El upsert hace que la carga se pueda repetir sin efectos secundarios.

**Cómo se verifica:**
1. `npm run test -- csv-player-parser` pasa en el backend.
2. Tras importar el masculino, `SELECT COUNT(*) FROM players WHERE gender = 'male';` devuelve 161.583.
3. Tras importar el femenino, `SELECT COUNT(*) FROM players WHERE gender = 'female';` devuelve 4.131.
4. Repetir las dos importaciones no cambia esos conteos.
5. `SELECT id, fifa_version FROM players WHERE fifa_player_id = 158023;` devuelve varias ediciones de Messi.

### Paginación y filtros del listado

**Decisión:** `GET /api/players` pagina por offset (`page` y `limit`) y responde `{ data, meta }`. Los filtros `name`, `club`, `position` y `nationality` son búsquedas parciales sin distinguir mayúsculas. `gender` y `fifaVersion` son coincidencia exacta. Los resultados se ordenan por `id` para que páginas consecutivas no repitan jugadores.

**Alternativas consideradas:** paginación por cursor (descartada: más compleja y el listado no necesita navegación en tiempo real); límite sin máximo (descartado: una petición podía devolver miles de filas).

**Motivo:** offset es suficiente para el volumen de datos del proyecto, y la respuesta es fácil de consumir desde Angular. El máximo de 100 por página protege la API.

**Cómo se verifica:**
1. `GET /api/players?page=1&limit=5` devuelve 5 jugadores y `meta.total` 32 con los fixtures cargados.
2. Páginas consecutivas no repiten ids.
3. `page=0`, `limit=abc` y `limit=1000` devuelven 400.
4. `npm run test:e2e` pasa.

### Alta, edición y validaciones de jugadores

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

### Exportar el listado filtrado a CSV

**Decisión:** `GET /api/players/export.csv` acepta los mismos filtros que el listado (`name`, `club`, `position`, `nationality`, `gender`, `fifaVersion`) y devuelve todas las filas que coinciden, sin paginación. La respuesta es `text/csv; charset=utf-8` con `Content-Disposition: attachment; filename="players.csv"`. El archivo empieza con BOM UTF-8 para que Excel muestre bien las tildes y la eñe. Los valores que empiezan con `=`, `+`, `-` o `@` se prefijan con una comilla simple para que Excel no los ejecute como fórmulas.

**Alternativas consideradas:** generar el archivo completo en memoria y responderlo de una vez (descartado: el listado completo son 165.000 filas); paginar la exportación (descartado: un CSV paginado obliga al usuario a unir archivos); exportar en XLSX (descartado por ahora: la consigna pide CSV y el hint de XLSX es opcional).

**Motivo:** la lectura se hace en lotes de 1.000 filas por clave `id` (keyset), así que la memoria se mantiene baja y cada lote se escribe antes de leer el siguiente. La ruta `export.csv` se declara antes de `:id`, porque si no, responde 400.

**Límite conocido:** si la base falla a mitad de la exportación, el archivo queda cortado y el cliente no recibe un error explícito, porque las cabeceras ya se enviaron.

**Cómo se verifica:**
1. `GET /api/players/export.csv` con token responde 200 con `Content-Type: text/csv` y `Content-Disposition` de descarga.
2. `GET /api/players/export.csv?gender=female` tiene 13 líneas (12 jugadores y la cabecera), igual que `meta.total` del listado con el mismo filtro más una.
3. `?page=2` y `?gender=otro` responden 400.
4. `npm run test:e2e` pasa completo.

### Estructura del frontend y sesión en el cliente

**Decisión:** el frontend usa rutas con un guard, un interceptor HTTP para el token y un servicio de autenticación. El token se guarda en `localStorage`. La URL de la API vive en `src/environments/environment.ts`. La pantalla de login usa reactive forms, y el diseño (variables de color y tipografía) está centralizado en `src/styles.css`.

**Alternativas consideradas:** guardar el token en una cookie HttpOnly. Descartado: requiere que el backend emita cookies y maneje CSRF, y el backend ya devuelve el token en el cuerpo de la respuesta.

**Motivo:** el backend usa JWT en el header `Authorization`. Con un interceptor, todas las llamadas a la API lo envían sin que cada componente lo sepa. Un 401 de la API cierra la sesión y lleva a `/login`.

**Restricción de puerto:** el backend solo acepta CORS desde `http://localhost:4200`. El frontend tiene que correr en ese puerto (`npm start -- --port 4200`). Si Angular usa otro puerto, el login falla con "No se pudo conectar con la API" aunque la API esté levantada.

**Cómo se verifica:**
1. Sin sesión, `/players` redirige a `/login`.
2. Un login correcto guarda el token en `localStorage` y navega a `/players`.
3. Un 401 de la API cierra la sesión.
4. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.

### Listado de jugadores en el frontend

**Decisión:** `/players` muestra el listado con filtros (nombre, club, posición, nacionalidad, género y versión), paginación de 20 en 20 y descarga CSV. Los filtros y la página viven en la URL, así que recargar o compartir el link conserva la búsqueda.

**Alternativas consideradas:** descargar el CSV con un `<a href>` directo. Descartado: el navegador no envía el header `Authorization`, así que la API respondería 401. La descarga se hace con `HttpClient` como `blob` y se guarda desde el cliente.

**Motivo:** los filtros en la URL permiten volver atrás y compartir búsquedas, y el blob mantiene la autenticación en todas las llamadas.

**Cómo se verifica:**
1. En `/players`, cada filtro cambia el listado y la URL.
2. Paginar no repite jugadores y "Anterior" está deshabilitado en la página 1.
3. "Descargar CSV" baja `players.csv` con los mismos filtros que la pantalla.
4. `npm test -- --watch=false --browsers=ChromeHeadless` pasa desde `football-api/frontend`.
