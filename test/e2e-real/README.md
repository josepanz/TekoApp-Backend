# E2E real (entorno aislado, solo local)

Smoke con supertest contra la app completa (`AppModule` + `MiddlewareConfig`, como `main.ts`) corriendo
en el proceso de Jest, conectada a un stack Docker descartable. Sin mocks. No corre en CI.

## Uso

```bash
pnpm e2e:up         # docker compose + espera de health + prisma migrate deploy + seed
pnpm e2e:seed       # re-sembrar (idempotente)
pnpm test:e2e:real  # smoke
pnpm e2e:down       # baja el stack y borra volúmenes
```

## Aislamiento (leer antes de tocar)

- El `.env` del repo apunta a Supabase compartido con datos reales: **ningún script e2e lo carga**.
  Solo se lee `.env.e2e` (gitignoreado; se crea desde `.env.e2e.example` si falta).
- `scripts/e2e/env.ts` aborta si alguna conexión contiene `supabase`/`pooler`, si el host no es
  `localhost`/`127.0.0.1`, si `DATABASE_URL` usa el puerto 5432 (Postgres nativo de Windows) o si
  `.env.e2e` no define alguna clave de `.env.example` (se leería de `.env`).
- Puertos propios: Postgres 55432, Mongo 57017, Redis 56379, MinIO 59000 (consola 59001),
  MailHog SMTP 51025 / UI 58025. Contenedores `tekoapp-e2e-*`.
- Claves RSA (JWT) y VAPID se generan en cada corrida; no se commitean ni se guardan.
- Stripe: claves `sk_test_*` stub. FCM/Twilio: stub (FCM degrada a "deshabilitado"). Email: MailHog.
- `RATE_LIMIT_MULTIPLIER` (1000 en `.env.e2e`) escala los `max` del rate limit; se IGNORA con
  `NODE_ENV=production`.
- Imagen de MinIO: `minio/minio` ya no está disponible en Docker Hub/quay, se usa
  `bitnamilegacy/minio` (crea el bucket `tekoapp-e2e-uploads` al arrancar).

## Credenciales de los fixtures

Prefijo de la API: `/tekoapp-backend/api/v1`.

| Qué | Usuario / clientId | Password / secret |
| --- | --- | --- |
| Basic Auth web | `tekoapp-web` | `e2e-web-secret` (`WEB_CLIENT_SECRET`) |
| Basic Auth mobile | `tekoapp-mobile` | `e2e-mobile-secret` (`MOBILE_CLIENT_SECRET`) |
| admin (rol ADMIN, `admin:all`) | `admin@tekoapp.com.py` | `Tekoapp123!` |
| cliente_a | `cliente_a@e2e.tekoapp.local` | `E2e-Passw0rd!` |
| cliente_b | `cliente_b@e2e.tekoapp.local` | `E2e-Passw0rd!` |
| pro_aprobado (APPROVED/VERIFIED) | `pro_aprobado@e2e.tekoapp.local` | `E2e-Passw0rd!` |
| pro_pendiente (PENDING) | `pro_pendiente@e2e.tekoapp.local` | `E2e-Passw0rd!` |
| compliance (rol COMPLIANCE) | `compliance@e2e.tekoapp.local` | `E2e-Passw0rd!` |

El seed corre `prisma/seed.ts` (base) y luego `prisma/seed-e2e.ts` (fixtures y rol COMPLIANCE, con los
permisos `legal.config:manage` y `legal.consent-audit:read`). Ambos son upserts.

## Nota sobre healthcheck

`/healthcheck` puede dar 503 solo por `storage_disk` (umbral de disco del host). El smoke exige que
Postgres, Mongo y Redis estén `up`, no el 200 global.
