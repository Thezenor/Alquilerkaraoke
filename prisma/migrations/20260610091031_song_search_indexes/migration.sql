-- Extensión pg_trgm para búsqueda por trigramas (ILIKE %q%). Trusted en PG13+,
-- no requiere superusuario. Necesaria para los índices GIN gin_trgm_ops de abajo.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Song_isPrimary_title_idx" ON "Song"("isPrimary", "title");

-- CreateIndex
CREATE INDEX "Song_isPrimary_performer_idx" ON "Song"("isPrimary", "performer");

-- CreateIndex
CREATE INDEX "Song_title_idx" ON "Song" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Song_performer_idx" ON "Song" USING GIN ("performer" gin_trgm_ops);

-- Los índices trigram antiguos sobre lower(title)/lower(performer)
-- (migración songs_search_trgm) no los usa Prisma: "contains insensitive"
-- genera ILIKE sobre la columna sin lower(). Se sustituyen por los de arriba
-- para no pagar el mantenimiento de dos GIN por columna en cada importación.
DROP INDEX IF EXISTS "Song_title_trgm_idx";
DROP INDEX IF EXISTS "Song_performer_trgm_idx";
