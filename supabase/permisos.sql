-- ============================================================================
-- Permisos de acceso a tablas (anon público de solo lectura / authenticated total)
--
-- Evita el error de PostgreSQL: "permission denied for table <nombre>" que
-- aparece en el panel de administración (authenticated) y en las páginas
-- públicas (anon) cuando las tablas no tienen GRANTs.
--
-- Nota: no otorga acceso a los datos por sí mismo: las políticas RLS
-- (ver supabase/rls-policies.sql) definen qué filas ve cada rol. Los GRANTs
-- son el prerrequisito sobre el que actúa RLS.
--
-- Idempotente: se puede ejecutar cuando sea, pero se recomienda ejecutarlo
-- DESPUÉS de schema.sql y ANTES de rls-policies.sql.
-- ============================================================================

-- Uso del esquema (sin esto no se puede tocar nada)
grant usage on schema public to anon, authenticated;

-- anon (visitantes sin sesión): solo lectura de catálogo público
grant select on all tables in schema public to anon;

-- authenticated (usuarios logueados, incluido el admin):
-- aquí RLS restringe cada operación al rol admin (is_admin()).
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Secuencias (por completitud; el esquema usa uuid por defecto)
grant select, usage on all sequences in schema public to anon, authenticated;

-- ============================================================================
-- Default privileges: aplica lo mismo a tablas creadas en el futuro
-- ============================================================================
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges grant usage on schemas to anon, authenticated;
alter default privileges in schema public grant select, usage on sequences to anon, authenticated;