# PROJECT_STATUS.md

## Estado actual
Fase: **1 — Base técnica** · Bloques 1–7 ✅ · **Desplegado en Railway (staging)**: https://alquilerkaraoke-production.up.railway.app
Web pública ES/EN/FR, health, BD migrada+sembrada y login admin verificados en producción (2026-06-06).

## Pendiente menor
- Cambiar la contraseña del Superadmin de producción (sembrado con `Admin_dev_2026!`).
- **Email**: infraestructura lista (no-op sin clave). Para activarlo en producción, fijar `RESEND_API_KEY` **o** `BREVO_API_KEY` + `EMAIL_FROM` (dominio verificado) y, opcional, `EMAIL_ADMIN` en Railway.

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
- [x] **Bloque 2 — Admin CRUD de packs**: módulo `/admin/packs` (listado con precio/estado, crear, editar) con `savePack` (Server Action + Zod), manejo de dinero €↔céntimos (`src/lib/money.ts`), reserva (%/fijo), fianza, traducciones EN/FR (JSON), activo/orden, auditoría y `updateTag(PACKS_TAG)`. Verificado: typecheck + lint + build + E2E (crear+editar) 4/4 (2026-06-07).
- [x] **Bloque 2b — Admin de extras, suplementos e IVA**: `/admin/extras` (CRUD con precio €, traducciones, activo), `/admin/tarifas` (editar **IVA** + alta/edición/borrado de **suplementos por provincia**). Helpers cacheados `src/server/pricing.ts` (`PRICING_TAG`) para el motor de presupuestos. Auditoría + `updateTag`. Verificado: typecheck + lint + build + E2E 5/5 (2026-06-07).
- [ ] Bloque 3 — Páginas públicas de packs (desde BD).
- [x] **Bloque 3 — Páginas públicas de packs**: `/packs` (listado SSG desde BD, precio "Desde X € + IVA", traducciones con fallback) y `/packs/[slug]` (detalle dinámico cacheado, JSON-LD `Product`/`Offer`, detalles de reserva/fianza/horas, CTA). Nav "Packs" + sitemap con slugs. Verificado: build + runtime (ES/EN, 404 slug inválido, JSON-LD, sitemap) + E2E 5/5 (2026-06-07).
- [x] **Bloque 4 — Motor de presupuestos**: función pura `src/lib/budget.ts` (base + horas extra + provincia + extras + suplementos % − descuento + IVA → total, reserva, fianza) con **7 tests unitarios** (`npm run test:unit`, runner nativo de Node + tsx). Página pública `/presupuesto` (ES/EN/FR) con formulario (pack, horas, fecha→fin de semana, provincia, nocturno, extras) que calcula vía Server Action `calculateQuote` (lee precios reales de BD) y muestra desglose + CTA. Header/home CTAs → `/presupuesto`; en sitemap. Verificado: unit 7/7 + typecheck + lint + build + E2E 6/6 (2026-06-07).
- [x] **Bloque 5 — Presupuesto → reserva pendiente**: modelo `Booking` (snapshot de importe + selección + consentimiento RGPD). Desde `/presupuesto`, tras calcular, el cliente rellena sus datos + acepta privacidad y **envía la solicitud de reserva** → se crea **PENDING** (regla: pendiente de validación). Admin **`/admin/reservas`** (lista + detalle con importe, extras, consentimiento, enlaces email/WhatsApp) para **validar/rechazar** (estado + notas, auditoría). Verificado: unit 7/7 + typecheck + lint + build + E2E 7/7 (incluye flujo presupuesto→reserva→validación) (2026-06-07).

**Fase 3 COMPLETA** ✅ (packs, tarifas, extras, suplementos, IVA, motor de presupuestos y reservas).

## Datos reales del negocio (Excel) — 2026-06-07
- [x] **Modelo de zonas/provincias**: `TariffZone` (suplemento por zona) + `Province` (asignada a zona); `category` en `Pack` y `Extra`. Sustituye al `ProvinceSupplement` placeholder. Motor de presupuestos usa **provincia → zona → suplemento**.
- [x] **Catálogo real cargado** (`prisma/seed-catalog.ts`, `npm run db:seed:catalog`): 4 zonas (Zona 4 marcada `pendingConfig`), 50 provincias, 14 productos reales (Karaoke 1/1+/2/3, Personalizado, Consolas 1/2/VR/4, Espuma, Holi 1/2/3, Furor) con precios/horas/categoría, 9 extras (Holi/Consolas). Placeholders de Fase 3 desactivados. Productos sin precio/descr. (Karaoke personalizado, Consolas 4) creados **inactivos** para revisar.
- [x] Admin `/tarifas` gestiona **zonas** (suplemento por zona, badge "pendiente"); packs/extras editan **categoría**.
- Pendiente (del informe): import/export Excel de tarifas; descuento por cliente (15%/35%); landings SEO por producto; corregir textos/typos de descripciones.

## Clientes y descuentos profesionales — 2026-06-07
- [x] **Modelo `Customer`** (email único, `isProfessional`, `discountPercent` 0–35). Las reservas crean/enlazan el cliente por email.
- [x] **Descuento**: el motor aplica el % **solo si el cliente está marcado como profesional** por el admin; si no, 0. Snapshot `discount` en `Booking`.
- [x] Admin **`/admin/clientes`** (lista + crear/editar): marcar profesional + asignar descuento + notas + ver reservas del cliente. Detalle de reserva muestra "Descuento profesional". Verificado E2E (9/9).

## Rediseño admin (plan en docs/22) — completado
- [x] **Fase A — Shell + Dashboard**: nuevo shell con **sidebar colapsable** (escritorio) + **drawer móvil**, navegación **agrupada** (Operativa/Catálogo/Precios/Sistema, filtrada por rol), iconos SVG propios, `StatusBadge` reutilizable. **Dashboard con KPIs** (reservas pendientes, del mes, leads, clientes pro, próximos eventos) + listas recientes + acciones rápidas. Placeholders de `/admin/calendario` y `/admin/recargos`. Verificado: typecheck+lint+build+E2E 9/9 (2026-06-07).
- [x] **Fase B — Backend de recargos por fecha**: modelo `DateBlock` + índice `Booking.eventDate` (migración `date_block`), `Surcharge.config` tipado (`SurchargeConfig`), motor ampliado con suplementos **FIXED** + función pura **`matchSurcharge`** (WEEKEND/NIGHT/SPECIAL_DATE single·range·weekday). `quoteAction` aplica todos los suplementos activos (uno por tipo, % y fijos). CRUD `Surcharge`/`DateBlock` (Zod+rol+audit+`updateTag`). +7 tests unitarios (15/15). Verificado: typecheck+lint+build+unit+E2E (2026-06-07).
- [x] **Fase C — Calendario UI**: `/admin/calendario` mobile-first (rejilla mensual escritorio + hoja inferior móvil), panel por día con reservas, recargos que aplican y bloqueo de disponibilidad. `/admin/recargos`: gestión de recargos recurrentes y por fecha (activar/desactivar/borrar) + fechas bloqueadas. `src/server/calendar.ts` (carga por mes). E2E `calendario.spec`. Desplegado en Railway (2026-06-07).
- [x] **Fase D — Mejoras de listas**: primitivos reutilizables `ListControls` (búsqueda con debounce + chips de filtro vía searchParams) y `Pagination` (enlaces, preserva filtros). Refactor de `/admin/reservas`, `/admin/solicitudes` y `/admin/clientes` con búsqueda server-side, filtro por estado/profesional, `StatusBadge`, estados vacíos y paginación (20–30/pág). Verificado: typecheck+lint+build+E2E 10/10 (2026-06-07).

## Pendientes funcionales
- [x] **Email**: módulo provider-agnóstico (`src/server/email`, Resend **o** Brevo vía fetch, sin SDK; no-op seguro si no hay clave). Al enviar `/presupuesto` se manda el presupuesto al cliente + aviso al admin; al recibir un lead de `/contacto` se avisa al admin. Plantillas HTML puras con escape anti-inyección. +3 tests unitarios (18/18). Best-effort: nunca bloquea la acción. **Falta solo** fijar la API key en Railway para activarlo (ver "Pendiente menor").
- Flujo RGPD de borrado/baja de marketing.

## Extras admin
- [x] **Acceso al panel desde el menú público** ("Acceso" en cabecera + móvil → `/admin/login`).
- [x] **Gestión de usuarios** (`/admin/usuarios`, solo SUPERADMIN): crear/editar usuarios, asignar **roles** (multi), **cambiar contraseña** (bcrypt), activar/desactivar, con salvaguardas (no quitarte SUPERADMIN ni desactivarte). Auditoría. Verificado E2E (crear usuario + login del nuevo usuario). → permite cambiar la contraseña del Superadmin de producción desde el panel.

## Marketing y RGPD (groundwork)
- [x] **Consentimiento en contacto**: checkbox de **política de privacidad** (obligatorio) + **opt-in de marketing** (opcional), guardando prueba (`acceptedTerms`, `marketingConsent`, `consentVersion`, `consentAt`, IP). Migración `contact_consent`.
- [x] **Página de privacidad** `/privacidad` (ES/EN/FR, borrador RGPD con datos de empresa desde `SiteConfig`, derechos incl. supresión) enlazada desde formulario y footer; en sitemap. El admin ve el consentimiento de cada lead.
- [ ] Newsletter (alta web) + campañas programadas de ofertas/eventos con proveedor de email (fase posterior). Textos legales finales pendientes de revisión.

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
