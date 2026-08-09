# Entorno dev/demo — correr los 3 proyectos localmente (gratis)

> Generado 2026-08-08 a pedido de José. Cubre: Android por USB sin Android Studio, backend +
> servicios externos en su capa gratuita, seed de usuarios, y una demo pública opcional en
> internet. Nada de esto es para producción ni publicación en tiendas.

## Mapa del entorno

Dos modos, no mezclarlos:

| Pieza | Modo local (por defecto) | Modo demo pública (opcional) |
|---|---|---|
| Backend | Tu PC, `pnpm run start:dev`, puerto 3000 | Render.com (free web service) |
| Base de datos | Docker Compose en tu PC (`docker-compose.yml`) | Neon (Postgres) + MongoDB Atlas |
| Web | Tu PC, `npm run dev`, puerto 3001 | Vercel (free) |
| Mobile Android | Tu teléfono por USB, `adb reverse` hacia tu PC | — (no hay build firmado todavía) |
| Mobile iOS | Mac + Simulator, misma WiFi que tu PC | — |

## 1. SDK de Android sin instalar Android Studio

Flutter necesita el Android SDK para compilar, no el IDE completo — solo las "command-line tools".

1. Descargar **"Command line tools only"** (Windows) desde la página oficial de Android Studio.
2. Descomprimir respetando exactamente esta ruta (Android exige la carpeta `latest`):
   `%LOCALAPPDATA%\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat`
3. Variables de entorno (una sola vez):
   ```powershell
   setx ANDROID_HOME "%LOCALAPPDATA%\Android\sdk"
   setx PATH "%PATH%;%LOCALAPPDATA%\Android\sdk\platform-tools;%LOCALAPPDATA%\Android\sdk\cmdline-tools\latest\bin"
   ```
   Reabrir la terminal para que tomen efecto.
4. Aceptar licencias e instalar lo mínimo:
   ```powershell
   sdkmanager --licenses
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   flutter config --android-sdk "%ANDROID_HOME%"
   ```
5. `flutter doctor -v` — la línea **Android toolchain** debe quedar en verde. La línea **Android
   Studio** sigue en rojo/amarillo — ignorarla, no hace falta para `flutter run` en un dispositivo
   físico.

## 2. Conectar el teléfono al backend

Con el teléfono por **cable**, lo más simple y confiable es `adb reverse`, no la WiFi: el teléfono
le pega a `localhost` y Android lo reenvía a la PC por el mismo USB. Cero firewall, cero IPs que
cambian.

**Recomendado — USB con `adb reverse`:**
1. Conectar el cable → aceptar "¿Permitir depuración USB?" en el teléfono.
2. `adb devices` → debe decir `device`, no `unauthorized`/`offline`.
3. `adb reverse tcp:3000 tcp:3000` (repetir cada vez que se desconecta el cable o se reinicia la
   PC — no es persistente).
4. Desde el teléfono, el backend es `http://127.0.0.1:3000`.

**Alternativa — misma WiFi (sin cable):**
1. `ipconfig` → IP LAN de la PC (ej. `192.168.1.50`).
2. Abrir el puerto 3000 en el Firewall de Windows para conexiones entrantes desde la red local.
3. Usar `http://<IP-LAN>:3000` como base URL.

**Plan B — fuera de la LAN**: si el teléfono y la PC alguna vez no comparten red (datos móviles,
WiFi de invitados aislado), **Tailscale** (gratis) arma una VPN mesh entre ambos sin abrir puertos
públicos. No hace falta en el caso normal (misma WiFi).

## 3. Backend local + cada servicio en su capa gratis

El repo ya trae `docker-compose.yml` con Postgres, MongoDB y Redis. Se agregó un servicio
**`minio`** (S3 compatible, corre en la PC, sin cuenta AWS) para que el almacenamiento de archivos
también sea 100% local.

```powershell
docker compose up -d postgres mongodb redis minio
pnpm install
pnpm run seed
pnpm run start:dev
```

Abrir `http://localhost:9001` (consola MinIO, `tekoapp` / `tekoapp123`) y crear el bucket
`tekoapp-uploads` una sola vez.

| Servicio | Para qué | Modo local | |
|---|---|---|---|
| PostgreSQL | Base principal (Prisma) | Ya está en `docker-compose.yml` | ✅ sin cuenta |
| MongoDB | Notificaciones, geolocalización histórica | Ya está en `docker-compose.yml` | ✅ sin cuenta |
| Redis | Colas (Bull), caché | Ya está en `docker-compose.yml` | ✅ sin cuenta |
| S3 (archivos) | Avatares, adjuntos | MinIO local — `S3_ENDPOINT=http://localhost:9000`, `S3_FORCE_PATH_STYLE=true` | ✅ sin cuenta |
| Email (SMTP) | Recuperación de contraseña, avisos | [Mailtrap](https://mailtrap.io) Free — inbox de pruebas, nunca manda un correo real | ✅ sin tarjeta |
| Firebase (push) | Notificaciones FCM a mobile | Proyecto en Firebase Console, plan **Spark** | ✅ sin tarjeta |
| Web Push (VAPID) | Push del navegador (Web) | Generado local: `node -e "console.log(require('web-push').generateVAPIDKeys())"` | ✅ sin cuenta |
| Stripe | Pagos | Cuenta Stripe, **modo Test** — `sk_test_...` | ✅ sin tarjeta para test keys |
| Twilio | SMS de verificación | Trial gratis — límite: solo manda a números verificados uno por uno en la consola | ✅ sin tarjeta, con límite |
| Google Maps | Geolocalización | Google exige tarjeta cargada para emitir cualquier key, aunque el uso de una demo se mantenga gratis — no hay forma de evitarlo sin cambiar de proveedor | ⚠️ pide tarjeta |

## 4. Usuarios y perfiles de prueba

```powershell
pnpm run seed        # catálogo base + clientes Basic Auth "tekoapp-web" y "tekoapp-mobile" + admin
pnpm run seed:dummy   # clientes, profesionales, servicios, pagos, ratings y promos ficticios
pnpm exec prisma studio   # explorar/elegir cualquier usuario dummy (tabla Users)
```

- Admin: `admin@tekoapp.com.py` / `Tekoapp123!`
- Todos los usuarios dummy (emails `*@example.com`) comparten la contraseña `Tekoapp123!`.
- `seed:dummy` no es idempotente — correrlo una sola vez sobre una base limpia.

## 5. Correr la app en el Android por USB

Con el backend corriendo (paso 3), el puerto reenviado (paso 2) y usuarios sembrados (paso 4):

```powershell
flutter devices   # anotar el device-id del teléfono
flutter run --dart-define-from-file=dart_defines.local.json -d <device-id>
```

`TekoApp-Frontend-Mobile/dart_defines.local.json` (gitignored, ya creado) trae
`API_BASE_URL=http://127.0.0.1:3000/tekoapp-backend/api` y el `BASIC_AUTH_CLIENT_SECRET` que debe
coincidir siempre con `MOBILE_CLIENT_SECRET` en el `.env` del backend — si se cambia uno, cambiar
el otro y volver a correr `pnpm run seed`. Si se usa la alternativa por WiFi del paso 2, editar la
IP en ese mismo archivo.

## 6. iOS en la Mac (misma red)

El Simulator de Xcode corre en la propia Mac y accede directo a la red — no hay alias `10.0.2.2`
(eso es solo del emulador Android) ni hace falta `adb reverse` (eso es solo USB/Android).

1. La Mac debe estar en la **misma WiFi** que la PC del backend.
2. Abrir el firewall del backend igual que la alternativa WiFi del paso 2.
3. Desde la Mac: `flutter run --dart-define=API_BASE_URL=http://<IP-LAN-de-tu-PC>:3000/tekoapp-backend/api --dart-define=BASIC_AUTH_CLIENT_ID=tekoapp-mobile --dart-define=BASIC_AUTH_CLIENT_SECRET=<mismo valor que MOBILE_CLIENT_SECRET>`.

## 7. Demo pública en internet (opcional)

Solo si en algún momento hace falta un link para alguien fuera de la red — no se necesita para
nada de lo de arriba. El backend deja de poder usar Docker local: todo tiene que ser alcanzable
desde internet.

- **Backend → Render.com** (free Web Service desde el `Dockerfile` del repo). Se "duerme" tras 15
  min sin tráfico, tarda ~30-50s en despertar — normal en el plan free.
- **Postgres → Neon** (no usar el Postgres free de Render, se borra a los 30 días).
- **MongoDB → Atlas M0** (512MB, no expira).
- **Redis → Upstash** (da un único endpoint `rediss://usuario:clave@host:puerto` — separar en
  `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`).
- **Archivos → Cloudflare R2** (10GB gratis, sin egreso — a diferencia de MinIO, sí pide tarjeta
  para activar R2 aunque el uso se mantenga gratis).
- **Web → Vercel** (hecho a medida para Next.js). Agregar la URL de Vercel a `ALLOWED_ORIGINS`/
  `FRONTEND_URL` del backend.

Mobile no entra en este modo — sigue siendo local por USB o Mac+Simulator, apuntando al backend
que se elija (local o el de Render).

## Qué se tocó en el código para esto (2026-08-08)

- `prisma/seed.ts` — faltaba el cliente Basic Auth `tekoapp-mobile`; sin esto el login de mobile
  fallaba siempre con `INVALID_CLIENT_ID`.
- `src/modules/storage/storage.module.ts` + `src/core/config/config-loader.ts` — soporte opcional
  `S3_ENDPOINT`/`S3_FORCE_PATH_STYLE` (aditivo, sin setear se comporta igual que antes) para poder
  usar MinIO/R2 en vez de forzar una cuenta AWS real.
- `docker-compose.yml` — servicio `minio` agregado.
- `.env` / `.env.example` — `MOBILE_CLIENT_SECRET`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` cargados;
  `.env` real de esta máquina apunta a MinIO local para S3.
- `TekoApp-Frontend-Mobile/dart_defines.local.json` (gitignored) — valores para
  `flutter run --dart-define-from-file=`.
- Ver `.claude/rules/database-conventions.md` (decisión final `id`/`referenceId`) y
  `TekoApp-Frontend-Mobile/openspec/decisions.md` (backlog de features grandes pedidas) para lo que
  quedó documentado pero no implementado todavía.
