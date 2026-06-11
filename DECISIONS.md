# DECISIONS.md — Decisiones cerradas

## Marca y negocio
- Marca principal: **Alquiler Karaoke**.
- Dominio: **www.alquilerkaraoke.com**.
- Teléfono: **607724965**.
- Estilo: moderno, profesional, oscuro/neón elegante, premium.
- Posicionamiento: servicio profesional, no barato.
- Marcas colaboradoras configurables desde admin con logo, descripción y enlace.
- Datos de empresa configurables desde admin.

## Servicios iniciales
Se incluirán los servicios de AlquilerKaraoke.com y Zenor, enfocados primero al karaoke:
- Karaoke.
- OkeBox.
- Cabina karaoke.
- Karaoke empresa.
- Karaoke bodas.
- Karaoke cumpleaños.
- Karaoke comuniones.
- Karaoke despedidas.
- Karaoke ayuntamientos/fiestas populares.
- DJ/discomóvil.
- Sonido.
- Iluminación.
- Fotomatón.
- Videomatón 360.
- Gaming/consolas.
- Pantallas.
- Eventos tipo Furor/concurso musical.

## Packs iniciales
Ampliables desde admin:
1. OkeBox día completo.
2. Karaoke Fiesta.
3. Karaoke Evento.
4. Karaoke Premium.
5. Cabina Karaoke.
6. Karaoke Empresa.
7. Karaoke + DJ.
8. Evento Furor / concurso musical.

## Precios
- Precios públicos como: **desde X € + IVA**.
- Precio base normal: **4 horas**.
- OkeBox: precio por día + envío/recogida configurable.
- Suplementos configurables:
  - provincia,
  - kilómetros,
  - fin de semana,
  - días concretos,
  - alta demanda,
  - nocturnidad,
  - exterior,
  - dificultad de montaje,
  - tipo de evento,
  - otros motivos configurables.
- Reserva: configurable por pack, porcentaje o cantidad fija.
- Fianza: configurable por pack/producto.
- Clientes especiales: descuento por defecto 15%, ampliable hasta 35%, configurable por cliente.

## Reservas
- El cliente puede contratar online.
- Toda contratación queda **reservada pendiente de validación por admin**.
- Admin puede bloquear fechas manualmente por reservas externas.
- Puede haber coincidencia de eventos según producto/material/técnico, pero no es lo normal.
- El cliente solo ve disponibilidad de la fecha consultada, no todo el calendario.

## Pagos
- Tarjeta/Stripe.
- Transferencia.
- Bizum manual.
- Pago de reserva.
- Pago completo.
- Pago restante desde área cliente.

## Facturación
- Proforma generada por la web.
- Factura manual.
- Admin puede marcar factura emitida.
- Admin puede subir factura PDF.
- Cliente puede descargar factura desde su panel.

## Contratos
- Contrato personalizado por servicio.
- Firma web:
  - checkbox aceptación condiciones,
  - firma dibujada,
  - guardar IP, fecha, hora y usuario,
  - guardar PDF firmado,
  - enviar copia al cliente por email.

## Cliente
Panel cliente con:
- eventos,
- presupuesto,
- aceptar presupuesto,
- pagar reserva,
- pagar restante,
- contrato,
- firma,
- proforma,
- documentos,
- solicitud de cambios,
- extras,
- chat interno no en vivo,
- fotos/vídeos del evento.

## Admin
Admin completo:
- dashboard,
- clientes,
- empresas,
- solicitudes,
- presupuestos,
- reservas,
- eventos,
- calendario,
- bloqueos manuales,
- packs,
- servicios,
- extras,
- tarifas,
- provincias y suplementos,
- colaboradores,
- técnicos,
- documentos,
- contratos,
- pagos,
- proformas,
- blog SEO,
- páginas SEO,
- traducciones,
- marcas colaboradoras,
- galería,
- testimonios,
- configuración legal,
- configuración empresa,
- logs.

No hace falta inventario completo en esta primera versión.

## Roles
- Superadmin.
- Administrador.
- Comercial.
- Técnico.
- Colaborador externo.
- Contabilidad.
- SEO/contenidos.
- Almacén/operario si hace falta.

## SEO
- Multiidioma ES/EN/FR con SEO por idioma.
- Páginas por ciudad, provincia, servicio y tipo de evento.
- Ciudades iniciales: Albacete, Madrid, Valencia, Alicante, Murcia, Barcelona, Toledo, Cuenca, Ciudad Real, Castellón, Zaragoza, Sevilla, Málaga.
- Admin SEO avanzado.
- Blog con IA desde admin.
- Contenido generado por IA siempre como borrador/revisión.

## Canciones
- Catálogo público de canciones.
- Subida por Excel.
- Búsqueda por título, intérprete e idioma.
- Descarga PDF: completo, por idioma, por artista, búsqueda actual y lista de evento.
- Cliente puede crear lista de canciones por evento.
- Invitados pueden añadir canciones con QR.
- Posibilidad de limitar número de canciones por evento.

## Galerías
- Fotos y vídeos.
- Galerías públicas y privadas.
- Acceso por clave.
- Caducidad.
- Permitir/bloquear descargas.
- Galería por evento.

## Clientes y descuentos (añadido 2026-06-07)
- Modelo `Customer`. El **descuento solo se aplica si el admin marca al cliente como "profesional"** y le asigna un `discountPercent` (0–35). Sin profesional → 0. Las reservas crean/enlazan el cliente por email; desde el formulario público NO se sobrescriben nombre/teléfono de un cliente existente (email no verificado).

## Auditoría de coherencia (2026-06-07) — pendientes registrados
Revisión con agentes (arquitectura, código, seguridad). Corregido: `/packs/[slug]` force-dynamic, tope de reserva %, separador de miles en importes, `formatCents` por locale, dedupe de suplementos por tipo, guard de lectura de PII en clientes/reservas/solicitudes, cabeceras de seguridad HTTP, enlace muerto "Canciones" eliminado, `aria-label` traducible, nav con Link i18n.
**Pendiente (siguientes fases):**
- Motor: suplementos por **km, fecha especial, alta demanda, exterior, dificultad de montaje, tipo de evento** y suplementos FIXED (hoy solo WEEKEND/NIGHT en %). Falta admin CRUD de `Surcharge`.
- **RGPD**: flujo de **borrado/anonimización** (ContactRequest/Booking/Customer) y **baja de marketing** (opt-out); retención/purga de IP.
- **Anti-abuso** en formularios públicos (rate-limit por IP, honeypot) antes de activar emails.
- Unificar patrón de Server Actions (tipo de estado, mensajes Zod, helper de rol) y extraer helpers duplicados (`int`, `orNull`).
- Disponibilidad/calendario + índice en `Booking.eventDate` (Fase 4).

## Marketing y RGPD (añadido 2026-06-07)
- **Objetivo**: web muy completa de servicios + captación para publicidad propia. Recoger emails (con consentimiento) para enviar **ofertas, novedades y eventos** de forma **programada/automática** en fechas concretas.
- **Consentimiento (RGPD/LOPDGDD)**:
  - Todo formulario (contacto, registro, newsletter) exige **aceptación de términos y política de privacidad** (checkbox obligatorio, sin premarcar).
  - **Opt-in de marketing separado y opcional** (recibir comunicaciones comerciales). Doble base: sin opt-in NO se envía publicidad.
  - Se guarda **prueba de consentimiento**: fecha/hora, versión de la política, IP.
- **Derechos del interesado**: acceso, rectificación, **supresión/borrado**, oposición y portabilidad. Habrá flujo de baja (unsubscribe) en cada email y borrado de datos desde admin/solicitud del usuario.
- **Páginas legales**: política de privacidad, aviso legal, términos y política de cookies (datos de empresa desde `SiteConfig`). Borradores marcados como **pendientes de revisión legal**.
- **Roadmap marketing** (fases posteriores): modelo `NewsletterSubscriber` + alta desde web; segmentación (leads con `marketingConsent`); campañas programadas (ofertas/eventos) con proveedor de email (Resend/Brevo); plantillas; métricas; gestión de bajas.

## IA
- Módulo IA indispensable.
- Proveedores: OpenAI, Claude, Gemini y otros.
- Claves API desde admin.
- Proveedor principal y alternativo.
- Límites, costes, logs y plantillas de prompts.

## Decisiones técnicas (Fase 1) — cerradas 2026-06-06
- **Framework**: Next.js **16** con **App Router** (React Server Components) + React 19.
  - Nota: la decisión inicial fue Next.js 15, pero al crear el proyecto (2026-06-06) la versión `latest` ya era la 16 (la 15 cerró ciclo). Se mantiene la 16 por ser la actual y más capaz, conservando App Router/RSC/TS/Tailwind. Aprobado por el responsable.
- **Lenguaje**: TypeScript en modo estricto.
- **Estilos**: Tailwind CSS.
- **i18n**: routing por **subruta de idioma** `/es`, `/en`, `/fr` con **next-intl v4** (`localePrefix: "always"`, defaultLocale `es`).
  - Rutas públicas bajo `src/app/[locale]/`. Layout raíz `app/layout.tsx` es **passthrough**; el `<html>/<body>` lo definen `[locale]/layout.tsx` (lang dinámico + hreflang) y `admin/layout.tsx`. El panel `/admin` es agnóstico de idioma.
  - `src/proxy.ts` compone el routing i18n (público) con la auth (`/admin`) en un único middleware.
  - SEO: canonical + hreflang (es/en/fr/x-default) por página, `sitemap.xml` con alternates y `robots.txt` (bloquea `/admin` y `/api`).
- **Base de datos**: PostgreSQL + Prisma **7** (sesión NextAuth en BD vía adaptador Prisma).
  - Prisma 7 usa Query Compiler y **requiere un driver adapter**: se usa `@prisma/adapter-pg` (paquete `pg`). El cliente se genera en `src/generated/prisma` (no se versiona; se regenera con `postinstall`).
  - Desarrollo local: PostgreSQL 17 instalado vía winget (puerto 5432, BD `alquilerkaraoke`).
- **Storage de ficheros**: externo compatible **S3 / Cloudflare R2** desde el inicio (Railway no se usa como almacenamiento de imágenes/documentos). Solo se deja previsto/configurado en Fase 1; la subida real se implementa en sus fases (galerías/documentos).
- **Deploy**: Railway, primero **staging**; producción solo tras validación.
- **Método de trabajo Fase 1**: implementación **bloque a bloque** con checklist de pruebas antes de avanzar.
- **Testing E2E**: **Playwright** (en el stack previsto). Tests en `e2e/`, `npm run test:e2e`. Requiere navegador (`npx playwright install chromium`) y la app sirviendo en `localhost:3000`.
- **Admin**: rutas bajo `/admin`. Grupo `(panel)` para páginas autenticadas (con chrome y guard de sesión en servidor, además del middleware); `/admin/login` fuera del grupo. Mutaciones vía **Server Actions** con validación **Zod**, auditoría (`AuditLog`) y restricción por rol. Invalidación de caché pública con **`updateTag`** (Next 16; sustituye al `revalidateTag` de un solo argumento).
- **Páginas públicas desde BD (catálogo)**: el build de Railway **no accede a la BD**, así que las páginas que dependen de datos de BD que deben reflejar cambios del admin (p. ej. `/packs`, `/packs/[slug]`, `sitemap`) se renderizan **dinámicas** (`export const dynamic = "force-dynamic"`) leyendo en runtime, con `unstable_cache` (tag) para rendimiento e invalidación. Tras desplegar a un entorno nuevo hay que **sembrar la BD** (`prisma db seed`, idempotente) para que haya contenido.
- **Sistema de diseño**: oscuro premium + neón (cian `#22d3ee`, magenta `#d946ef`) definido como tokens `@theme` en `globals.css` (Tailwind v4). Utilidades `bg-brand-*`, `text-brand-*`, `text-glow`. Web siempre en modo oscuro. Datos de contacto (teléfono/WhatsApp) provienen de `SiteConfig` (no hardcodeados) vía `getSiteConfig`/`getContact` con `unstable_cache` (tag `site-config`) para no romper el render estático.
- **Autenticación**: Auth.js / NextAuth **v5** con provider de **credenciales** (email + contraseña, hash bcrypt). Adaptador Prisma incluido y listo para futuros providers OAuth.
  - **Estrategia de sesión: JWT** (no sesión en BD). Motivo: el provider de credenciales de Auth.js v5 sólo admite JWT; la sesión en BD requeriría OAuth/email. El JWT va firmado con `AUTH_SECRET`. La decisión inicial mencionaba "sesión en BD"; se ajusta por restricción técnica de Auth.js v5. Si en el futuro se añade login OAuth, puede revisarse.
  - **Protección de rutas**: `src/proxy.ts` (convención Next 16, antes `middleware.ts`) protege `/admin` y exige rol de panel (`ADMIN_PANEL_ROLES`). El panel admin es agnóstico de idioma (sin prefijo de locale).
  - **Auditoría**: cada login registra un evento `user.login` en `AuditLog`.
- **Descuentos (códigos promocionales)**: el descuento de un código **no se acumula** con el descuento de cliente profesional; se aplica el **mayor** de los dos porcentajes (más el descuento fijo del código si lo hubiera). El uso del código (`usedCount`/`maxUses`) se reserva de forma **atómica** en BD (`$executeRaw` condicional) para evitar condiciones de carrera. Un código del 100% / fijo ≥ subtotal deja total 0 a propósito (la reserva nace PENDING y la valida el admin); si se quisiera un tope de negocio < 100% habría que añadirlo explícitamente.
- **Documentos con PII por token** (`/contrato/[token]` y su PDF): acceso por token secreto (`randomBytes(24)`), sin indexar (`X-Robots-Tag: noindex` + `robots.txt` bloquea `/contrato`), con rate-limit. La firma electrónica guarda nombre, fecha, IP, user-agent y hash SHA-256 de integridad; su valor probatorio es de aceptación tipo *clickwrap* (reforzable con OTP si se requiere).
- **Rate-limiting**: limitador en memoria por instancia (suficiente en staging). Para producción multi-instancia debe migrarse a un store compartido (Redis/Upstash o Cloudflare).
- **Diseño premium y conversión (2026-06-10)**:
  - **Tipografía display**: titulares públicos H1/H2 usan **Space Grotesk** (`--font-display`, aplicada vía clase `public-headings` en el `<body>` del layout `[locale]`); el cuerpo sigue en Geist y el admin no cambia.
  - **"Acceso" (login admin) se mueve del header al footer** (zona legal, discreto) para liberar el header para conversión: teléfono clicable (de `getContact`, no hardcodeado) junto al CTA. **Revisado 2026-06-11 a petición del cliente**: "Acceso" vuelve también al header (desktop, discreto junto al selector de idioma, y al final del panel móvil); el enlace del footer se mantiene. Conviven ambos.
  - **Barra CTA fija inferior solo móvil** (<sm) en páginas públicas: presupuesto + llamar + WhatsApp. Va con `z-40`, por debajo del banner de cookies (`z-50`), y se oculta en `/presupuesto`. El FAB de WhatsApp se oculta en <sm para no duplicar.
  - **CTAs de las landings de ciudad** apuntan a `/[locale]/presupuesto` (antes `/contacto`) con texto de acción i18n (`CityLanding.ctaButton`).
  - **Microinteracciones**: `<Reveal>` (fade-up al entrar en viewport), contadores animados de stats en la home y `card-lift` en cards públicas. Todo respeta `prefers-reduced-motion` y degrada a contenido visible sin JS (SEO intacto).
- **Usuarios del panel (2026-06-11)**:
  - **Borrado de usuarios: físico** (`deleteUser`, solo SUPERADMIN). Es seguro porque todas las FKs hacia `User` son `onDelete: SetNull` (AuditLog, ContactRequest, Booking, Payment, Contract, Post) o `Cascade` (Account/Session): la auditoría histórica se conserva con `userId = null` y el log `user.delete` guarda email/nombre/roles del eliminado en `metadata` para trazabilidad. Salvaguardas: no puedes eliminarte a ti mismo ni eliminar/desactivar/quitar el rol al **último superadmin activo**.
  - **`User.lastLoginAt`**: se actualiza en el evento `signIn` de Auth.js (best-effort, nunca bloquea el login).
  - **`/admin/perfil` (Mi cuenta)**: cualquier usuario del panel edita su nombre y cambia su contraseña verificando la actual (bcrypt); el email solo lo cambia un superadmin desde `/admin/usuarios`.
- **SEO/GEO (2026-06-10)**:
  - **Bots de IA permitidos**: `robots.txt` permite explícitamente **GPTBot, PerplexityBot, ClaudeBot y Google-Extended** (con los mismos disallow de `/admin`, `/api` y `/contrato`). Decisión consciente: queremos aparecer como fuente en respuestas de ChatGPT, Perplexity, Claude y Gemini (GEO). Se publica además **`/llms.txt`** (markdown generado desde BD: servicios, packs con precio "desde", ciudades, contacto y enlaces clave).
  - **Slugs no traducidos en EN/FR**: las rutas públicas usan los slugs en español en los tres idiomas (`/en/packs/karaoke-fiesta`, `/fr/karaoke/madrid`…). Decisión consciente: simplifica el routing/hreflang y evita duplicar slugs por idioma en BD; el contenido sí se traduce. Si en el futuro se quieren slugs localizados, requerirá campo de slug por locale y redirecciones.
  - **Blog monolingüe por entrada**: cada post existe en un único idioma (`Post.locale`). La URL solo es válida bajo su propio prefijo; otros prefijos hacen **redirect permanente** a la URL canónica y no se emite hreflang a variantes inexistentes (alineado con el sitemap).
  - **Protección del host no canónico**: el middleware añade `X-Robots-Tag: noindex, nofollow` cuando la request no llega por el host de `NEXT_PUBLIC_SITE_URL`. Hoy esa variable apunta al host de Railway (no se activa); cuando se conecte www.alquilerkaraoke.com y se cambie la variable, el subdominio de Railway dejará de ser indexable automáticamente. La redirección 301 del host antiguo se añadirá cuando el dominio esté conectado.
  - **LocalBusiness completo y grafo conectado**: el JSON-LD global ([locale]/layout) emite el nodo `Organization/LocalBusiness` con `@id` `{SITE_URL}/#organization`; dirección, horario (`openingHoursSpecification`) y coordenadas son configurables en admin (SiteConfig) y solo se publican si están rellenos. El resto de schemas (home, ciudades, eventos, servicios) referencian ese nodo por `@id` en vez de duplicar entidades anónimas.
