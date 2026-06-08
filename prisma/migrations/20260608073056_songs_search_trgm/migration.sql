-- Búsqueda rápida por título/intérprete en catálogos grandes (180k+).
-- Requiere la extensión pg_trgm (disponible en PostgreSQL estándar / Railway).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices GIN trigram sobre versiones en minúsculas para ILIKE/contains veloz.
CREATE INDEX IF NOT EXISTS "Song_title_trgm_idx" ON "Song" USING gin (lower("title") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Song_performer_trgm_idx" ON "Song" USING gin (lower("performer") gin_trgm_ops);
