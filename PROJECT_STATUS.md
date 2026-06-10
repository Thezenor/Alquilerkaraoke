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
- [x] **RGPD**: módulo `src/server/gdpr.ts` (anonimización conservando importes + baja de marketing). **Público**: página `/baja-marketing` (ES/EN/FR, noindex, anti-spam) que pone `marketingConsent=false` sin revelar si el email existe + enlace en el footer. **Admin** (SUPERADMIN/ADMIN): botón "Anonimizar datos personales" con confirmación en el detalle de cliente (anonimiza cliente + PII de sus reservas) y de solicitud (anonimiza + archiva), con auditoría. E2E `rgpd.spec` (12/12).

## Fase 4 — Pagos
- [x] **Pagos manuales + estado de pago** (2026-06-07): modelo `Payment` (cobros/reembolsos en céntimos, método TRANSFER/BIZUM/CASH/CARD/OTHER) + `Booking.paymentStatus` (PENDING/PARTIAL/PAID) y `amountPaid` cacheado, recalculados al añadir/borrar pagos. Migración `payments`. Admin: sección **Pagos** en el detalle de reserva (resumen total/cobrado/pendiente, alta de cobro o reembolso, borrado con confirmación) + badge de pago en el listado. Datos de pago del cliente (**IBAN/Bizum/instrucciones**) en `SiteConfig` + formulario de configuración, incluidos en el email del presupuesto. Helper puro `derivePaymentStatus` + 6 tests unitarios (24/24). E2E `pagos.spec` (13/13).
- [x] **Proforma/presupuesto en PDF** (2026-06-07): generación con `pdf-lib` (JS puro, sin navegador headless) en `src/server/pdf/proforma.ts` — documento A4 con datos de empresa, cliente, evento, conceptos (servicio + extras), totales, estado de pago e instrucciones de pago. Ruta `GET /admin/reservas/[id]/proforma` (guard de sesión + auditoría `proforma.download`) y botón "Proforma (PDF)" en el detalle. Importes y texto saneados a WinAnsi (sin fallos con emojis/€). +2 tests unitarios (26/26). E2E `proforma.spec` (15/15). **Pendiente Fase 4**: pago online con Stripe (requiere claves) — aparcado.

## Conversión — testimonios y pack destacado (2026-06-10)
- [x] **Testimonios (prueba social)**: modelo `Testimonial` (autor, tipo de evento, cita, rating 1–5, idioma es/en/fr, enlace a la reseña, activo/orden). Migración `testimonials_and_featured_pack`. **Admin** `/admin/testimonios` (CRUD, rol SUPERADMIN/ADMIN, Zod, auditoría, `updateTag`) + entrada en navegación (Catálogo). **Público**: sección "Lo que dicen nuestros clientes" en la home (estrellas SVG accesibles, 1 col móvil → 3 desktop, solo activos del idioma con fallback a ES; oculta si no hay datos) + **JSON-LD `aggregateRating` + `Review`** (media con 1 decimal + 3 reseñas) añadido al `Service` de la home **solo con datos reales en BD**. `src/server/testimonials.ts` cacheado por tag. Sin seed (testimonios siempre reales desde admin).
- [x] **Pack destacado ("Más popular")**: `Pack.isFeatured` (misma migración) + checkbox "Destacado (más popular)" en el admin de packs (badge en el listado). En `/packs` el destacado lleva **badge pill i18n + borde cian con glow**. No se fuerza unicidad en BD (si hay varios, todos llevan badge).

## Fase 10 — Endurecimiento (revisión con agentes)
- [x] **Pase de seguridad y calidad** (2026-06-08): revisión con agentes (security-specialist + code-reviewer) de pagos/proforma/contratos/blog/descuentos/RGPD y corrección de los hallazgos accionables:
  - **Códigos de descuento**: reserva del uso **atómica** (`$executeRaw` condicional con `usedCount < maxUses` + fechas/activo) → sin condición de carrera ni rebasar `maxUses`. El descuento del código **no se acumula** con el profesional (se aplica el mayor de los dos % + fijo) → evita "servicio gratis" por stacking. E2E de tope de usos.
  - **PDFs con PII**: `X-Robots-Tag: noindex,nofollow` en proforma y contrato; **rate-limit** en `/contrato/[token]/pdf`; `/contrato` añadido a `robots.txt`.
  - **Pagos**: el reembolso no puede superar lo cobrado; `recomputeBookingPayment` ahora **transaccional** (lectura+escritura).
  - **RGPD**: `anonymizeCustomer` también anonimiza la PII de los **contratos** (incl. imagen de firma) y limpia `Booking.locale`.
  - **Robustez admin**: `delete*` (blog/descuentos/colaboradores) en try/catch (no rompen la navegación ante FK).
  - **i18n**: la página pública de firma usa el `locale` de la reserva para importes/fechas.
  - **Anti-spam**: límite de presupuestos subido a 30/10 min por IP (mejor UX, sigue bloqueando abuso).
  - Confirmado correcto por los agentes (sin acción): XSS del Markdown del blog, inyección en PDF, guards de rol admin, exclusión de `/contrato` en el proxy.
  - **Pendiente anotado**: rate-limit compartido (Redis/Cloudflare) antes de producción multi-instancia; reforzar valor probatorio de la firma (OTP) si se requiere legalmente.
  - Verificado: typecheck + lint + build + unit 44/44 + E2E 21/21.

## Fase 6 — Catálogo de canciones
- [x] **Subida desde el admin + exportaciones** (2026-06-08): subida del catálogo **.xlsx o .csv hasta ~200 MB** desde `/admin/canciones` mediante un **route handler** que recibe el fichero por streaming a un temporal y lo procesa **en segundo plano** (`SongImportJob` con progreso en vivo que el panel consulta). Lectura por streaming con **exceljs** (xlsx) y **csv-parse** (csv) → inserción por lotes + optimización; reemplaza el catálogo. **Exportar CSV** (streaming, admin) y **PDF del repertorio por idioma** (`/canciones/pdf`, 2 columnas, tope 8.000). Migración `song_import_job`. E2E `canciones-import` (subir→publicar→PDF→CSV→vaciar). Validado el parser xlsx y la deduplicación.
- [x] **Base del catálogo** (2026-06-08): leyenda de idiomas (`src/lib/song-languages.ts`, abreviaturas del cliente no-ISO). Modelos `SongBrand` (nombre + **calidad** + activo) y `Song` (idioma, código, título, intérprete, marca, `dedupKey`, `isPrimary`); migraciones `songs_catalog` + `songs_search_trgm` (extensión **pg_trgm** + índices GIN para búsqueda rápida a 180k+). Deduplicación pura (`song-dedup.ts`) y `optimizeCatalog()` en SQL (elige la versión de la marca de mayor calidad). **Importador CSV por streaming** (`npm run db:import:songs -- archivo.csv`, reemplaza catálogo y optimiza; detecta delimitador y cabeceras). **Web** `/canciones`: buscador (título/intérprete) + filtro por idioma + nº por idioma + total no repetidas + paginación. **Admin** `/admin/canciones`: estadísticas, gestión de marcas/calidad y botón **Reoptimizar**. +4 tests unitarios (49/49). E2E `canciones`. **Pendiente**: importar el Excel real (lo dejará el cliente), subida/reimport desde admin (requiere almacenamiento) y PDF del repertorio.

## Pie de página rediseñado (2026-06-08)
- [x] **Footer rediseñado**: 4 columnas (marca + tagline + iconos de redes · Servicios con enlaces a cada servicio + packs · Información: blog/FAQ/contacto/privacidad/baja · Contacto: teléfono/email/WhatsApp) + barra inferior con copyright. Datos desde `SiteConfig` (editables en admin). Redes sociales **ficticias** sembradas en producción (`db:seed:socials`, guardado) para que se vean ya; se cambian en `/admin/configuracion`.

## Anti-spam Turnstile — bloque F
- [x] **Cloudflare Turnstile** (2026-06-08): widget (`src/components/turnstile.tsx`) + verificación servidor (`src/server/turnstile.ts`) integrados en los formularios públicos (presupuesto, contacto, baja de marketing). **No-op si no hay claves** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`): siguen honeypot + rate-limit; con claves, se exige el captcha. Fail-open ante errores de red (es anti-spam, no auth). Para activar: fijar ambas claves en Railway.

## Extras condicionados — bloque B (parte 1)
- [x] **Extras según el pack** (2026-06-08): `Extra.appliesToCategories String[]` (migración `extra_applies_to`). El formulario de presupuesto **filtra los extras** según la categoría del pack seleccionado (vacío = aplica a todos), con defensa en el servidor (`quoteAction` descarta extras incompatibles). Admin de extras: selector de "Aplica a estos packs". Seed de catálogo etiqueta los extras existentes (Holi→Fiesta Holi, Gaming→Gaming/Consolas) de forma guardada (no pisa ediciones). E2E `extras-compat`.
- [x] **Segunda actividad** (2026-06-08): botón **"Añadir otra actividad"** en el presupuesto: varias actividades (cada una con su pack, horas y extras compatibles). `Booking.activities` (migración `booking_activities`). El presupuesto combina todas las actividades en un único total reutilizando `calculateBudget` (base+horas+extras de cada actividad sumados; suplementos/descuento/IVA una vez). Se incluyen en el mensaje de WhatsApp, en el detalle de reserva del admin y como líneas independientes en la **proforma PDF**. E2E `segunda-actividad`.

## Marca, redes y pie — bloque D+E
- [x] **Pie + marca/tema en admin** (2026-06-08): `SiteConfig` amplía con **redes sociales** (instagram, facebook, tiktok, youtube, twitter) — migración `site_social`. Formulario de **Configuración** reorganizado en secciones (Empresa · **Marca y tema** con logos/favicon/OG por URL y **selector de color** principal · **Redes sociales** · Pago · Contrato). **Pie de página** rediseñado: enlaces (servicios, packs, blog, contacto, **FAQ**, privacidad, baja) + **iconos de redes** desde `SiteConfig`. **Color principal** configurable aplicado en runtime (variable CSS de tema en el `<body>`). Nueva página **`/faq`** (SSG, JSON-LD `FAQPage`) movida fuera de `/servicios` y enlazada en el pie; en sitemap. E2E de redes en el pie + FAQ. La subida de imágenes (logos) queda para más adelante (por ahora por URL).

## Servicios (menú desplegable + SEO) — bloque C
- [x] **Servicios editables** (2026-06-08): modelo `Service` (slug, nombre, categoría de packs asociada, descripción Markdown, imagen, meta SEO, traducciones EN/FR, orden, activo). Migración `services`. **Admin** `/admin/servicios` (CRUD, rol SUPERADMIN/ADMIN, auditoría, `updateTag`). **Público**: `/servicios/[slug]` (hero + contenido SEO en Markdown + **lista de packs de su categoría** + CTAs) y el índice `/servicios` lista los servicios. **Menú "Servicios" desplegable** en la cabecera (desktop hover/focus + submenú móvil) alimentado desde BD. Sitemap incluye los servicios. Seed `npm run db:seed:services` (Karaoke, Gaming, Espuma, Holi, Furor). E2E `servicios.spec` (23/23).

## Fase 8 — Blog / SEO
- [x] **Blog de contenidos** (2026-06-07): modelo `Post` (slug único, locale, título, extracto, contenido Markdown, portada, estado DRAFT/PUBLISHED, publishedAt, meta SEO, autor). Migración `blog`. **Renderizador Markdown propio y seguro** (`src/lib/markdown.tsx`: # títulos, **negrita**, listas, [enlaces] — sin `dangerouslySetInnerHTML` ni HTML embebido; neutraliza `javascript:`). **Admin** `/admin/blog` (CRUD, rol SUPERADMIN/ADMIN/SEO_CONTENIDOS, auditoría, `updateTag`, publishedAt al publicar). **Público** `/blog` (listado por idioma) y `/blog/[slug]` (detalle con JSON-LD `BlogPosting` + meta). Enlace "Blog" en la cabecera + entradas publicadas en el `sitemap`. +4 tests unitarios (44/44). E2E `blog.spec` (20/20). La generación IA queda como borrador opcional para más adelante.

## Fase 9 — Descuentos
- [x] **Códigos de descuento** (2026-06-07): modelo `DiscountCode` (código único en mayúsculas, % o cantidad fija, usos máximos, validez por fechas, contador de usos). Migración `discount_codes`. Motor de presupuesto ampliado con **descuento fijo** (`discountFixed`, capado al subtotal) + función pura `evaluateDiscountCode`/`normalizeCode`. El formulario público `/presupuesto` admite un **código** (opcional; inválidos se ignoran sin filtrar su existencia); al reservar se aplica (sumado al descuento profesional), se guarda en `Booking.discountCode` y se incrementa el uso. Admin `/admin/descuentos`: CRUD (SUPERADMIN/ADMIN, auditoría) + entrada en navegación (Precios). Detalle de reserva muestra el código usado. +6 tests unitarios (40/40). E2E `descuentos.spec` (19/19).

## Fase 9 — Colaboradores
- [x] **Marcas colaboradoras** (2026-06-07): modelo `Collaborator` (nombre, logo, enlace, descripción, orden, activo). Migración `collaborators`. **Admin** `/admin/colaboradores` (lista + crear/editar/eliminar, rol SUPERADMIN/ADMIN, auditoría, `updateTag`). **Público**: sección "Colaboradores" en la home (logos con enlace externo `nofollow`, o el nombre si no hay logo) que solo aparece si hay colaboradores activos. `getActiveCollaborators` cacheado por tag. Seed de ejemplo `npm run db:seed:collaborators` (Zenor, KaraokeMedia, Karaoke Machines, OkeBox). E2E `colaboradores.spec` (18/18). Logos reales: subir luego (igual que packs). **Pendiente Fase 9**: descuentos/códigos y automatizaciones.

## Packs — presentación (fotos + qué incluye)
- [x] **Foto de producto + contenido** (2026-06-07): `Pack.imageUrl`/`imageAlt` (migración `pack_image`). La web pública muestra **foto** en el listado y en el detalle; si no hay foto, **placeholder provisional por categoría** (`/public/packs/ph-*.svg`: karaoke, gaming, espuma, holi, furor, default) vía `src/lib/pack-image.ts`. El detalle muestra **"Qué incluye"** como lista de viñetas (parseada de `description`, una línea por ítem) + JSON-LD con `image`. Admin: campos de foto (URL + alt) en el formulario de pack y miniatura en el listado. +5 tests unitarios. Las fotos reales se suben luego cambiando `imageUrl`.

## Fase 5 — Contratos PDF + firma web
- [x] **Contratos con firma electrónica** (2026-06-07): modelo `Contract` (1:1 con `Booking`; estado DRAFT/SENT/SIGNED/CANCELLED, token de enlace, snapshot de cláusulas, firma con nombre/fecha/IP/UA + hash SHA-256 de integridad + imagen de firma dibujada opcional). Migración `contracts`. **Admin** (detalle de reserva): generar contrato, copiar/reenviar enlace por email, anular, descargar PDF. **Público** `/contrato/[token]` (agnóstico de idioma, noindex, anti-spam): muestra condiciones + firma **clickwrap** (nombre + aceptación) y **canvas** de firma dibujada opcional; PDF en `/contrato/[token]/pdf` (token-gated). Cláusulas configurables en `SiteConfig.contractTerms` (con texto por defecto en `src/lib/contract-terms.ts`). PDF multipágina con `pdf-lib`. `proxy.ts` excluye `/contrato` del prefijo de idioma. +3 tests unitarios (29/29). E2E `contratos.spec` (17/17).

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
