# 17 — Railway deploy (staging)

## Objetivo
Desplegar Alquiler Karaoke en Railway (primero **staging**, producción tras validación).

## Arquitectura de deploy
- **Builder**: Nixpacks (detecta Next.js). Config en `railway.json`.
- **Build**: `npm install` (ejecuta `postinstall` → `prisma generate`) + `npm run build`.
- **Start**: `npx prisma migrate deploy && npm run start` (aplica migraciones y arranca Next).
- **Healthcheck**: `GET /api/health` → `{ status: "ok" }`.
- **Node**: `>=20.9` (`.nvmrc` = 22).
- `prisma` está en `dependencies` para que `migrate deploy` funcione en runtime.

## Pasos (GitHub + Railway)
1. **Subir a GitHub** (el repo ya existe):
   ```
   git remote add origin <URL_DEL_REPO>
   git push -u origin main
   ```
2. **Railway → New Project → Deploy from GitHub repo** y selecciona el repositorio.
3. **Añadir base de datos**: en el proyecto Railway, *New → Database → PostgreSQL*. Railway crea `DATABASE_URL`.
4. **Variables de entorno del servicio** (Settings → Variables):
   - `DATABASE_URL` → referencia a la del PostgreSQL de Railway (`${{Postgres.DATABASE_URL}}`).
   - `AUTH_SECRET` → secreto aleatorio (`openssl rand -base64 32`).
   - `AUTH_TRUST_HOST` → `true`.
   - `NEXTAUTH_URL` y `AUTH_URL` → URL pública del servicio (p. ej. `https://<app>.up.railway.app`).
   - `NEXT_PUBLIC_SITE_URL` → misma URL pública (canonical, sitemap, OG).
   - `NODE_ENV` → `production`.
   - (Opcional, futuras fases) `STRIPE_*`, `RESEND_API_KEY`/`BREVO_API_KEY`, `S3_*`, claves IA.
5. **Primer deploy**: Railway construye y arranca; `migrate deploy` crea las tablas.
6. **Seed del Superadmin** (una vez), desde tu máquina con la CLI de Railway:
   ```
   railway run npm run db:seed
   ```
   Define antes `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` en las variables de Railway (si no, usa valores por defecto que DEBES cambiar).
7. **Verificar**: abrir la URL pública (`/es`), `/api/health` y `/admin/login`.

## Notas
- El cliente Prisma (`src/generated/prisma`) no se versiona; se regenera en build con `postinstall`.
- Storage de imágenes/documentos: externo (S3/R2) en fases posteriores; Railway no se usa como almacenamiento.
- Producción: repetir con dominio `www.alquilerkaraoke.com` y `NEXT_PUBLIC_SITE_URL` correspondiente, solo tras validar staging.

## Variables probables (resumen)
- DATABASE_URL
- AUTH_SECRET / (NEXTAUTH_SECRET)
- AUTH_TRUST_HOST
- NEXTAUTH_URL / AUTH_URL
- NEXT_PUBLIC_SITE_URL
- STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (Fase 4)
- RESEND_API_KEY / BREVO_API_KEY
- S3_* (storage)
- OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY (Fase 8)
