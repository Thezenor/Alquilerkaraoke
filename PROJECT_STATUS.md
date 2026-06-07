# PROJECT_STATUS.md

## Estado actual
Fase: **1 — Base técnica** · Bloques 1–7 ✅ · **Desplegado en Railway (staging)**: https://alquilerkaraoke-production.up.railway.app
Web pública ES/EN/FR, health, BD migrada+sembrada y login admin verificados en producción (2026-06-06).

## Pendiente menor
- Cambiar la contraseña del Superadmin de producción (sembrado con `Admin_dev_2026!`).
- Email automático al recibir leads (Resend/Brevo) — pendiente de proveedor.

## Despliegue
- Railway (staging). **Auto-deploy desde GitHub reconectado** (2026-06-07): la GitHub App de Railway necesitaba acceso explícito al repo `Alquilerkaraoke`. Ahora cada push a `main` despliega solo.
- `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` / `AUTH_URL` ya configuradas (SEO/canonical correctos).

## Objetivo inmediato
**Fase 2 — Web pública SEO mobile-first** en curso.
- [x] **Bloque 1 — Infraestructura SEO + Home enriquecido**: helper `buildMetadata` (canonical + hreflang **por página**), JSON-LD `LocalBusiness` (desde `SiteConfig`), imagen OG dinámica de marca (`opengraph-image`), `metadataBase` global, y home con secciones reales (servicios, segmentos, cómo trabajamos, CTA) trilingües. Middleware excluye rutas de metadata. Verificado: build + runtime (secciones ES/EN, JSON-LD, OG 200, canonical/hreflang) + E2E sin regresión (2026-06-06).
- [x] **Bloque 2 — Contacto con captación de leads**: página pública `/contacto` (ES/EN/FR) con formulario (Server Action + Zod) que **guarda en BD** (`ContactRequest`) y panel **WhatsApp/teléfono**; módulo admin **Solicitudes** (lista + detalle + responder/estado, auditoría, enlaces rápidos email/WhatsApp). Nav y CTAs conectados al formulario. Verificado: build + E2E del flujo completo (enviar→admin→responder) 3/3 (2026-06-06). Email automático al recibir lead: pendiente de configurar proveedor.
- [x] **Bloque 3 — Servicios + landings por ciudad (SEO local)**: página `/servicios` (servicios, FAQ + JSON-LD FAQPage, enlaces internos) y landings dinámicas `/karaoke/[ciudad]` para 13 ciudades × 3 idiomas (SSG), con H1/intro/FAQ interpolados por ciudad, JSON-LD `Service` + `FAQPage`, CTA y enlazado interno. Sitemap ampliado (servicios, contacto, ciudades). Nav "Servicios" conectado. Verificado: build SSG (39 páginas de ciudad), runtime (ES/EN/FR, 404 ciudad inválida, sitemap) + E2E 3/3 (2026-06-07).

## Fase 3 — Packs, tarifas y motor de presupuestos (en curso)
- [x] **Bloque 1 — Modelo de datos + seed**: modelos `Pack`, `Extra`, `ProvinceSupplement`, `Surcharge`, `PricingConfig` (precios en céntimos sin IVA, IVA configurable, traducciones JSON, reserva/fianza por pack). Migración `packs_pricing` aplicada y seed idempotente (8 packs, 4 extras, suplementos de ejemplo, IVA 21%) — `update:{}` para no pisar ediciones de admin. Verificado: datos en BD + typecheck + lint + build (2026-06-07).
- [ ] Bloque 2 — Admin CRUD de packs (y extras/suplementos).
- [ ] Bloque 3 — Páginas públicas de packs (desde BD).
- [ ] Bloque 4 — Motor de presupuestos (función pura) + formulario.
- [ ] Bloque 5 — Presupuesto → reserva pendiente de validación.

## Bloques Fase 1
- [x] **Bloque 1 — Scaffolding**: Next.js 16 (App Router, TS estricto, Tailwind v4), estructura de carpetas (`src/lib`, `src/components`, `src/server`, `messages/`), ESLint + Prettier (orden clases Tailwind), `.editorconfig`, `.env.example`, scripts npm. Verificado: typecheck + lint + format + build en verde (2026-06-06).
- [x] **Bloque 2 — Base de datos y Prisma**: Prisma 7 con adapter `pg`, esquema mínimo (`User` + enum `Role`, `Account`/`Session`/`VerificationToken` para NextAuth, `AuditLog`, `SiteConfig`), migración inicial `init` aplicada y seed (SiteConfig + Superadmin). PostgreSQL 17 local. Verificado: datos en BD + typecheck + lint + build en verde (2026-06-06).
- [x] **Bloque 3 — Auth.js/NextAuth v5**: login por credenciales (bcrypt) con sesión JWT, adaptador Prisma, `src/proxy.ts` protegiendo `/admin` por rol (`ADMIN_PANEL_ROLES`), página de login + dashboard, helpers de roles y auditoría `user.login`. Verificado end-to-end: redirección sin sesión, login OK con Superadmin, sesión con roles, `/admin` accesible y evento en `AuditLog` (2026-06-06).
- [x] **Bloque 4 — i18n + SEO base**: next-intl v4 con subrutas `/es /en /fr` (localePrefix always), rutas públicas reestructuradas bajo `[locale]/`, layout raíz passthrough + html/body en `[locale]/layout` (lang dinámico) y `admin/layout`. `proxy.ts` compone routing i18n + auth. SEO: canonical + hreflang (es/en/fr/x-default) en `<head>`, `sitemap.xml` con alternates y `robots.txt`. Verificado en runtime: `/`→`/es`, 3 idiomas con contenido/lang correctos, hreflang, sitemap, robots y `/admin` protegido (2026-06-06).
- [x] **Bloque 5 — Sistema de diseño base**: tokens de marca en `globals.css` (oscuro premium + neón cian/magenta, `@theme` Tailwind v4), primitivos UI (`Button`, `Container`), shell público (header fijo con menú móvil, footer, FAB de WhatsApp) y home con hero premium. Datos de contacto leídos de `SiteConfig` con `unstable_cache` (web sigue estática/SSG, revalidate 1h). Verificado: build SSG + estructura renderizada en ES/EN/FR (2026-06-06).
- [x] **Bloque 6 — Admin mínimo + Configuración de empresa**: grupo de rutas `(panel)` con chrome (topbar + nav) y guard de sesión en servidor; dashboard; módulo **Configuración de empresa** (CRUD de `SiteConfig`) con server action, validación Zod, auditoría `config.update`, restricción a SUPERADMIN/ADMIN e invalidación con `updateTag` (Next 16). Helpers `requireAdminSession`/`requireRole` y `logAudit`. Verificado con **Playwright E2E** (guardado→reflejo en web pública→restaurar, y protección por sesión) + typecheck/lint/build (2026-06-06).
- [~] **Bloque 7 — Railway staging**: configuración lista en el repo (`railway.json`, `/api/health`, `.nvmrc`, `prisma` en dependencies, `startCommand` con `migrate deploy`, guía en `docs/17`). Git inicializado (rama `main`, commit inicial) y remoto `origin` → GitHub. **Pendiente**: push + creación del servicio/Postgres en Railway + variables + seed (requiere autenticación del usuario).

## Entorno
- Node.js v24.16.0 + npm 11.13.0 (instalado vía winget, 2026-06-06).
- PostgreSQL 17 local (servicio `postgresql-x64-17`, puerto 5432, instalado vía winget). BD de desarrollo: `alquilerkaraoke`. Credenciales en `.env` (no versionado).
- Superadmin sembrado: `admin@alquilerkaraoke.com` (contraseña en `.env`, cámbiala para producción).

## No hacer todavía
- No implementar aplicación completa.
- No crear diseño definitivo sin validar guía visual.
- No desplegar en Railway todavía.
- No eliminar requisitos.

## Siguiente paso recomendado para Claude/Antigravity
1. Leer `CLAUDE.md`.
2. Leer `DECISIONS.md`.
3. Leer `docs/20-fases-desarrollo.md`.
4. Leer `docs/21-reglas-para-claude-antigravity.md`.
5. Crear el proyecto Next.js base.
6. Configurar TypeScript, Tailwind, linting y estructura.
7. Crear admin/auth mínimo solo cuando esté la base técnica validada.

## Checklist fase 0
- [x] Decisiones principales recopiladas.
- [x] Estructura documental creada.
- [x] Agentes definidos.
- [x] Skills definidas.
- [x] Proyecto Next.js creado.
- [ ] Base de datos definida.
- [ ] Diseño visual validado.
