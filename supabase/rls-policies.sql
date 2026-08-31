-- ============================================================================
-- WONG ObraSmart - Políticas Row Level Security (Supabase / PostgreSQL)
-- FASE 26 - ETAPA 1
--
-- Requiere supabase/schema.sql (RLS ya habilitado) y supabase/seed.sql.
--
-- Roles:
--   anon           -> visitante público (solo lectura del catálogo publicable)
--   authenticated  -> gestiona catálogo/clientes/cotizaciones/pedidos/alquileres
--                     SOLO si su JWT declara app_metadata.role = 'admin'
--   service_role   -> bypasa RLS (herramientas admin, migraciones)
--
-- Cómo marcar a un usuario como admin (Supabase Auth):
--   update auth.users
--   set raw_app_meta_data = jsonb_set(
--         coalesce(raw_app_meta_data, '{}'),
--         '{role}', '"admin"'
--       )
--   where email = 'admin@wongobrasmart.pe';
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: ¿es el usuario autenticado un administrador?
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
    select coalesce(
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
        false
    );
$$;

-- ============================================================================
-- CATEGORIAS
-- Público: solo categorías activas. Admin: gestión total.
-- ============================================================================
drop policy if exists "categorias_select_public" on public.categorias;
create policy "categorias_select_public"
on public.categorias
for select
to anon, authenticated
using (estado = 'activo');

drop policy if exists "categorias_select_admin" on public.categorias;
create policy "categorias_select_admin"
on public.categorias
for select
to authenticated
using (public.is_admin());

drop policy if exists "categorias_insert_admin" on public.categorias;
create policy "categorias_insert_admin"
on public.categorias
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "categorias_update_admin" on public.categorias;
create policy "categorias_update_admin"
on public.categorias
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "categorias_delete_admin" on public.categorias;
create policy "categorias_delete_admin"
on public.categorias
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- PRODUCTOS
-- Público: catálogo lee productos visibles (no agotados). Admin: gestión total.
-- ============================================================================
drop policy if exists "productos_select_public" on public.productos;
create policy "productos_select_public"
on public.productos
for select
to anon, authenticated
using (estado <> 'agotado');

drop policy if exists "productos_select_admin" on public.productos;
create policy "productos_select_admin"
on public.productos
for select
to authenticated
using (public.is_admin());

drop policy if exists "productos_insert_admin" on public.productos;
create policy "productos_insert_admin"
on public.productos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "productos_update_admin" on public.productos;
create policy "productos_update_admin"
on public.productos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "productos_delete_admin" on public.productos;
create policy "productos_delete_admin"
on public.productos
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- KITS
-- Público: solo kits activos. Admin: gestión total.
-- ============================================================================
drop policy if exists "kits_select_public" on public.kits;
create policy "kits_select_public"
on public.kits
for select
to anon, authenticated
using (estado = 'activo');

drop policy if exists "kits_select_admin" on public.kits;
create policy "kits_select_admin"
on public.kits
for select
to authenticated
using (public.is_admin());

drop policy if exists "kits_insert_admin" on public.kits;
create policy "kits_insert_admin"
on public.kits
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "kits_update_admin" on public.kits;
create policy "kits_update_admin"
on public.kits
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "kits_delete_admin" on public.kits;
create policy "kits_delete_admin"
on public.kits
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- KIT_PRODUCTOS (composición de kits)
-- Público: solo ítems de kits activos (para mostrar el detalle). Admin: total.
-- ============================================================================
drop policy if exists "kit_productos_select_public" on public.kit_productos;
create policy "kit_productos_select_public"
on public.kit_productos
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.kits k
        where k.id = kit_productos.kit_id
          and k.estado = 'activo'
    )
);

drop policy if exists "kit_productos_select_admin" on public.kit_productos;
create policy "kit_productos_select_admin"
on public.kit_productos
for select
to authenticated
using (public.is_admin());

drop policy if exists "kit_productos_insert_admin" on public.kit_productos;
create policy "kit_productos_insert_admin"
on public.kit_productos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "kit_productos_update_admin" on public.kit_productos;
create policy "kit_productos_update_admin"
on public.kit_productos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "kit_productos_delete_admin" on public.kit_productos;
create policy "kit_productos_delete_admin"
on public.kit_productos
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- MAQUINARIAS
-- Público: solo maquinaria disponible. Admin: gestión total.
-- ============================================================================
drop policy if exists "maquinarias_select_public" on public.maquinarias;
create policy "maquinarias_select_public"
on public.maquinarias
for select
to anon, authenticated
using (disponible = true);

drop policy if exists "maquinarias_select_admin" on public.maquinarias;
create policy "maquinarias_select_admin"
on public.maquinarias
for select
to authenticated
using (public.is_admin());

drop policy if exists "maquinarias_insert_admin" on public.maquinarias;
create policy "maquinarias_insert_admin"
on public.maquinarias
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "maquinarias_update_admin" on public.maquinarias;
create policy "maquinarias_update_admin"
on public.maquinarias
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "maquinarias_delete_admin" on public.maquinarias;
create policy "maquinarias_delete_admin"
on public.maquinarias
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- CLIENTES (datos privados: solo admin)
-- ============================================================================
drop policy if exists "clientes_select_admin" on public.clientes;
create policy "clientes_select_admin"
on public.clientes
for select
to authenticated
using (public.is_admin());

drop policy if exists "clientes_insert_admin" on public.clientes;
create policy "clientes_insert_admin"
on public.clientes
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "clientes_update_admin" on public.clientes;
create policy "clientes_update_admin"
on public.clientes
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "clientes_delete_admin" on public.clientes;
create policy "clientes_delete_admin"
on public.clientes
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- COTIZACIONES (solo admin)
-- ============================================================================
drop policy if exists "cotizaciones_select_admin" on public.cotizaciones;
create policy "cotizaciones_select_admin"
on public.cotizaciones
for select
to authenticated
using (public.is_admin());

drop policy if exists "cotizaciones_insert_admin" on public.cotizaciones;
create policy "cotizaciones_insert_admin"
on public.cotizaciones
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "cotizaciones_update_admin" on public.cotizaciones;
create policy "cotizaciones_update_admin"
on public.cotizaciones
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "cotizaciones_delete_admin" on public.cotizaciones;
create policy "cotizaciones_delete_admin"
on public.cotizaciones
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- COTIZACION_DETALLES (solo admin)
-- ============================================================================
drop policy if exists "cotizacion_detalles_select_admin" on public.cotizacion_detalles;
create policy "cotizacion_detalles_select_admin"
on public.cotizacion_detalles
for select
to authenticated
using (public.is_admin());

drop policy if exists "cotizacion_detalles_insert_admin" on public.cotizacion_detalles;
create policy "cotizacion_detalles_insert_admin"
on public.cotizacion_detalles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "cotizacion_detalles_update_admin" on public.cotizacion_detalles;
create policy "cotizacion_detalles_update_admin"
on public.cotizacion_detalles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "cotizacion_detalles_delete_admin" on public.cotizacion_detalles;
create policy "cotizacion_detalles_delete_admin"
on public.cotizacion_detalles
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- PEDIDOS (solo admin)
-- ============================================================================
drop policy if exists "pedidos_select_admin" on public.pedidos;
create policy "pedidos_select_admin"
on public.pedidos
for select
to authenticated
using (public.is_admin());

drop policy if exists "pedidos_insert_admin" on public.pedidos;
create policy "pedidos_insert_admin"
on public.pedidos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "pedidos_update_admin" on public.pedidos;
create policy "pedidos_update_admin"
on public.pedidos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "pedidos_delete_admin" on public.pedidos;
create policy "pedidos_delete_admin"
on public.pedidos
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- PEDIDO_DETALLES (solo admin)
-- ============================================================================
drop policy if exists "pedido_detalles_select_admin" on public.pedido_detalles;
create policy "pedido_detalles_select_admin"
on public.pedido_detalles
for select
to authenticated
using (public.is_admin());

drop policy if exists "pedido_detalles_insert_admin" on public.pedido_detalles;
create policy "pedido_detalles_insert_admin"
on public.pedido_detalles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "pedido_detalles_update_admin" on public.pedido_detalles;
create policy "pedido_detalles_update_admin"
on public.pedido_detalles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "pedido_detalles_delete_admin" on public.pedido_detalles;
create policy "pedido_detalles_delete_admin"
on public.pedido_detalles
for delete
to authenticated
using (public.is_admin());

-- ============================================================================
-- ALQUILERES (solo admin)
-- ============================================================================
drop policy if exists "alquileres_select_admin" on public.alquileres;
create policy "alquileres_select_admin"
on public.alquileres
for select
to authenticated
using (public.is_admin());

drop policy if exists "alquileres_insert_admin" on public.alquileres;
create policy "alquileres_insert_admin"
on public.alquileres
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "alquileres_update_admin" on public.alquileres;
create policy "alquileres_update_admin"
on public.alquileres
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "alquileres_delete_admin" on public.alquileres;
create policy "alquileres_delete_admin"
on public.alquileres
for delete
to authenticated
using (public.is_admin());