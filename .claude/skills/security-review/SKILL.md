# security-review

## Descripción
Revisar seguridad de auth, roles, permisos, documentos, pagos, formularios, APIs y variables de entorno.

## Cuándo usar
Usar cuando la tarea esté relacionada con: revisar seguridad de auth, roles, permisos, documentos, pagos, formularios, apis y variables de entorno.

## Procedimiento
1. Leer `CLAUDE.md` y `DECISIONS.md` si la tarea afecta decisiones globales.
2. Revisar los requisitos relacionados en `docs/`.
3. Implementar o proponer cambios mínimos y seguros.
4. Verificar mobile-first, SEO y seguridad si aplica.
5. Actualizar documentación cuando cambien decisiones o alcance.

## Checklist obligatorio
- [ ] No rompe mobile-first.
- [ ] No rompe SEO.
- [ ] No hardcodea datos configurables.
- [ ] Respeta roles/permisos si toca admin.
- [ ] Tiene pruebas o checklist de validación.
