# 22 — Rediseño del admin + calendario de recargos (plan de agentes)

Resultado de la revisión con agentes (admin-panel-specialist + ui-ux-designer), 2026-06-07. Blueprint para implementar por fases.

## Navegación / shell
- **Sidebar fija colapsable** en escritorio (`w-60` / `w-16`) + **topbar con drawer** en móvil (foco atrapado, cierre con Esc, `aria-current`).
- Grupos: **Operativa** (Dashboard, Reservas, Calendario, Clientes, Solicitudes) · **Catálogo** (Packs, Extras) · **Precios** (Tarifas, Recargos y fechas) · **Sistema** (Configuración, Usuarios [SUPERADMIN]).
- Nav filtra ítems por rol de sesión (no hardcode). Iconos SVG inline propios (sin librería).

## Dashboard
- Fila de **KPIs**: Reservas pendientes (destacado, neón), reservas del mes, leads sin gestionar, clientes profesionales, próximos eventos.
- Paneles: reservas pendientes, últimos leads, "próximas fechas" (widget calendario), acciones rápidas.
- Todo Server Component leyendo Prisma (respetando guard de PII).

## Calendario de recargos (núcleo)
- **Datos**: reutilizar `Surcharge` con `config Json` tipado por Zod: `{ mode: "single"|"range"|"weekday", date?, from?, to?, weekdays?, label? }`. Soportar `valueType` PERCENT/FIXED. Sustituir el `isWeekend` hardcodeado por regla `WEEKEND` con `config.weekdays=[0,6]`.
- **Bloqueos** de disponibilidad → modelo aparte `DateBlock { date, endDate?, reason?, packId? }`. Añadir `@@index([eventDate])` a `Booking`.
- **Motor**: ampliar `calculateBudget` para aceptar suplementos FIXED + función pura `matchSurcharge(surcharge, {date, night})`; incluir SPECIAL_DATE/HIGH_DEMAND en la query; nuevos tests unitarios.
- **CRUD `Surcharge`**: Server Action + Zod + auditoría + `updateTag(PRICING_TAG)`.
- **UI**: vista mensual (grid 7 col, `gap-px` sobre `bg-brand-border`) en escritorio; **vista agenda** en móvil. Celda = `<button>` con badges (neón=recargo +%/€, magenta=evento, rojo=bloqueado). Panel lateral (drawer derecho desktop / bottom-sheet móvil) para crear/editar/borrar. Construido a mano con **date-fns** (sin librerías de calendario pesadas).

## Listas (todas)
- `StatusBadge` reutilizable (tones: pending ámbar, success esmeralda, danger rojo, neutral gris, info cian) con `ring-inset`.
- Filtros (searchParams, server) + búsqueda + chips de estado; acciones rápidas; **tarjetas apiladas en móvil** (no tablas con scroll). Estados vacíos con borde discontinuo.
- Primitivos `Field`/`Input` con estilo estándar reutilizable.

## Fases de implementación
- **A** — Shell (sidebar/drawer agrupada) + Dashboard con KPIs. (No toca BD/motor.)
- **B** — Backend recargos por fecha: migración (`DateBlock`, índice eventDate), `Surcharge.config` tipado, motor ampliado (FIXED, SPECIAL_DATE, matchSurcharge) + tests, CRUD `Surcharge`.
- **C** — Calendario UI (mes + agenda + panel).
- **D** — Mejoras de listas (filtros, búsqueda, StatusBadge, paginación, tarjetas móvil).

## Decisiones a registrar al implementar (DECISIONS.md)
- Shell admin = sidebar fija colapsable (desktop) + topbar/drawer (móvil); iconos SVG propios; calendario a mano con date-fns.
- Recargo por fecha vía `Surcharge.config` tipado; bloqueos vía `DateBlock`; índice `Booking.eventDate`.
- `WEEKEND` configurable por `config.weekdays` (sustituye hardcode). Motor soporta suplementos FIXED + por fecha (cierra pendiente del informe del Excel).
- Dependencia nueva: `date-fns`.
