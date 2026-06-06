# CLAUDE.md — Contexto maestro del proyecto

## Proyecto
Nombre: **Alquiler Karaoke**  
Dominio final: **www.alquilerkaraoke.com**  
Teléfono principal: **607724965**  
Hosting objetivo: **Railway**  
Carpeta local: `C:\claude_alquilerkaraoke`

## Visión
Construir desde cero una web/plataforma moderna, profesional, mobile-first y SEO-first para contratar servicios de alquiler de karaoke y eventos en España.

La marca principal es **Alquiler Karaoke**. Se podrán mostrar marcas colaboradoras desde admin, con logo, enlace y descripción. Ejemplos: Zenor Audiovisual, KaraokeMedia, Karaoke Machines, OkeBox u otras.

## Posicionamiento
No competir por precio bajo. Posicionamiento de servicio profesional, moderno, fiable y premium.

Mensaje estratégico:
> No alquilamos solo una máquina: montamos una experiencia profesional de karaoke y eventos para particulares, empresas, bodas, fiestas y acciones de marca.

## Prioridades obligatorias
1. Mobile-first real.
2. Navegación móvil perfecta.
3. SEO técnico desde el principio.
4. Rendimiento alto en móvil.
5. Admin potente y escalable.
6. Sistema de precios configurable.
7. Contratación pendiente de validación por admin.
8. Multiidioma: ES, EN, FR.
9. Optimización SEO de imágenes.
10. Desarrollo por fases, probando cada fase antes de avanzar.

## Stack recomendado
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Auth.js / NextAuth
- Stripe
- Railway
- Cloudflare
- Resend/Brevo para emails
- Sharp para optimización de imágenes
- Playwright para testing
- Zod para validaciones
- React Hook Form
- next-intl para multiidioma
- Generación PDF para contratos, presupuestos, proformas y catálogo de canciones

## Reglas de trabajo
- No crear una web genérica.
- No usar diseño básico tipo plantilla.
- No avanzar a la siguiente fase sin checklist de pruebas.
- No eliminar requisitos del proyecto sin anotarlo en `DECISIONS.md`.
- No cambiar decisiones cerradas sin aprobación.
- Cualquier página pública debe nacer con SEO, mobile-first y rendimiento.
- Cualquier módulo admin debe tener roles/permisos, logs y validaciones.
- Cualquier generación de IA en admin debe quedar como borrador pendiente de revisión humana cuando afecte contenido público.

## Fases generales
1. Base técnica, diseño, arquitectura, auth, admin mínimo y documentación.
2. Web pública SEO mobile-first.
3. Packs, servicios, tarifas, provincias, extras y motor de presupuestos.
4. Clientes, reservas, eventos, pagos y proformas.
5. Contratos PDF, firma web y documentos.
6. Catálogo de canciones y PDF.
7. Galerías públicas/privadas.
8. Blog/SEO/IA.
9. Colaboradores, descuentos y automatizaciones.
10. Testing, seguridad, optimización y Railway production.
