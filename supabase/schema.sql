-- ============================================================================
-- WONG ObraSmart - Esquema de base de datos PostgreSQL (Supabase)
--
-- Esquema canónico ALINEADO con la base de datos real (consolida los
-- cambios aplicados por migraciones posteriores):
--   - Estados finales de cotizaciones (nueva/en_revision/cotizada/aceptada/
--     rechazada) y alquileres (solicitado/reservado/entregado/devuelto/
--     cancelado), reemplazando los CHECK originales.
--   - KitObra IA: cotizaciones.area/presupuesto y
--     cotizacion_detalles.tipo/descripcion_producto.
--   - Índice único parcial de pedidos.cotizacion_id (una cotización -> un
--     solo pedido).
--
-- Sin datos de ejemplo, sin políticas RLS (ver seed.sql y rls-policies.sql).
-- gen_random_uuid() está disponible de forma nativa en PostgreSQL 13+ (Supabase).
-- ============================================================================

-- ============================================================================
-- 1. categorias
-- ============================================================================
create table public.categorias (
    id          uuid primary key default gen_random_uuid(),
    nombre      text not null unique,
    descripcion text,
    estado      text not null default 'activo'
                check (estado in ('activo', 'inactivo')),
    created_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. productos
-- ============================================================================
create table public.productos (
    id           uuid primary key default gen_random_uuid(),
    categoria_id uuid not null references public.categorias (id) on delete restrict,
    nombre       text not null,
    subcategoria text check (subcategoria in (
                     'cemento', 'agregados', 'ladrillos', 'fierro',
                     'herramientas', 'pintura', 'tuberias'
                 )),
    descripcion  text,
    precio       numeric(12,2) not null default 0 check (precio >= 0),
    unidad       text not null,
    stock        integer not null default 0 check (stock >= 0),
    imagen       text,
    estado       text not null default 'disponible'
                 check (estado in ('disponible', 'bajo stock', 'agotado')),
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- ============================================================================
-- 3. clientes
-- ============================================================================
create table public.clientes (
    id         uuid primary key default gen_random_uuid(),
    nombre     text not null,
    telefono   text not null,
    email      text,
    direccion  text,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- 4. kits
-- ============================================================================
create table public.kits (
    id                uuid primary key default gen_random_uuid(),
    nombre            text not null,
    descripcion       text,
    tipo_obra         text not null,
    precio_referencial numeric(12,2) not null default 0 check (precio_referencial >= 0),
    estado            text not null default 'activo'
                      check (estado in ('activo', 'inactivo')),
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

-- ============================================================================
-- 5. maquinarias
-- ============================================================================
create table public.maquinarias (
    id          uuid primary key default gen_random_uuid(),
    nombre      text not null,
    descripcion text,
    precio_dia  numeric(12,2) not null default 0 check (precio_dia >= 0),
    disponible  boolean not null default true,
    imagen      text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ============================================================================
-- 6. kit_productos (intermedia M:N kits <-> productos)
-- ============================================================================
create table public.kit_productos (
    id          uuid primary key default gen_random_uuid(),
    kit_id      uuid not null references public.kits (id) on delete cascade,
    producto_id uuid not null references public.productos (id) on delete restrict,
    tipo        text not null check (tipo in ('material', 'herramienta', 'maquinaria')),
    cantidad    numeric(12,4) not null default 1 check (cantidad >= 0),
    unidad      text not null,
    observacion text,
    created_at  timestamptz not null default now(),
    constraint uk_kit_productos unique (kit_id, producto_id)
);

-- ============================================================================
-- 7. cotizaciones
-- ============================================================================
create table public.cotizaciones (
    id              uuid primary key default gen_random_uuid(),
    codigo          text not null unique,
    cliente_id      uuid not null references public.clientes (id) on delete restrict,
    kit_id          uuid references public.kits (id) on delete set null,
    tipo_obra       text not null,
    area            numeric(12,2),
    presupuesto     numeric(12,2),
    descripcion_obra text,
    observaciones   text,
    total           numeric(12,2) not null default 0 check (total >= 0),
    fecha_emision   date not null default current_date,
    estado          text not null default 'nueva'
                    check (estado in (
                        'nueva', 'en_revision', 'cotizada',
                        'aceptada', 'rechazada'
                    )),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ============================================================================
-- 8. cotizacion_detalles
-- ============================================================================
create table public.cotizacion_detalles (
    id                  uuid primary key default gen_random_uuid(),
    cotizacion_id       uuid not null references public.cotizaciones (id) on delete cascade,
    producto_id         uuid references public.productos (id) on delete set null,
    descripcion         text not null,
    cantidad            numeric(12,4) not null check (cantidad >= 0),
    unidad              text not null,
    precio_unitario     numeric(12,2) not null check (precio_unitario >= 0),
    subtotal            numeric(12,2) not null check (subtotal >= 0),
    tipo                text not null default 'material'
                        check (tipo in ('material', 'herramienta', 'maquinaria')),
    descripcion_producto text,
    created_at          timestamptz not null default now()
);

-- ============================================================================
-- 9. pedidos
-- ============================================================================
create table public.pedidos (
    id            uuid primary key default gen_random_uuid(),
    codigo        text not null unique,
    cliente_id    uuid not null references public.clientes (id) on delete restrict,
    cotizacion_id uuid references public.cotizaciones (id) on delete set null,
    fecha_pedido  date not null default current_date,
    total         numeric(12,2) not null default 0 check (total >= 0),
    estado        text not null default 'pendiente'
                  check (estado in (
                      'pendiente', 'confirmado', 'preparando',
                      'listo', 'entregado', 'cancelado'
                  )),
    observaciones text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- ============================================================================
-- 10. pedido_detalles
-- ============================================================================
create table public.pedido_detalles (
    id              uuid primary key default gen_random_uuid(),
    pedido_id       uuid not null references public.pedidos (id) on delete cascade,
    producto_id     uuid references public.productos (id) on delete set null,
    descripcion     text not null,
    cantidad        numeric(12,4) not null check (cantidad >= 0),
    unidad          text not null,
    precio_unitario numeric(12,2) not null check (precio_unitario >= 0),
    subtotal        numeric(12,2) not null check (subtotal >= 0),
    created_at      timestamptz not null default now()
);

-- ============================================================================
-- 11. alquileres
-- ============================================================================
create table public.alquileres (
    id           uuid primary key default gen_random_uuid(),
    codigo       text not null unique,
    cliente_id   uuid not null references public.clientes (id) on delete restrict,
    maquinaria_id uuid not null references public.maquinarias (id) on delete restrict,
    fecha_inicio date not null,
    fecha_fin    date not null,
    dias         integer not null check (dias >= 1),
    precio_dia   numeric(12,2) not null check (precio_dia >= 0),
    total        numeric(12,2) not null check (total >= 0),
    estado       text not null default 'solicitado'
                 check (estado in (
                     'solicitado', 'reservado', 'entregado',
                     'devuelto', 'cancelado'
                 )),
    observaciones text,
    created_at   timestamptz not null default now(),
    constraint chk_alquileres_fechas check (fecha_fin >= fecha_inicio)
);

-- ============================================================================
-- Índices de apoyo (foreign keys y columnas de alta consulta)
-- ============================================================================
create index idx_productos_categoria_id       on public.productos (categoria_id);
create index idx_kits_nombre                  on public.kits (nombre);
create index idx_kit_productos_kit_id         on public.kit_productos (kit_id);
create index idx_kit_productos_producto_id    on public.kit_productos (producto_id);
create index idx_cotizaciones_cliente_id      on public.cotizaciones (cliente_id);
create index idx_cotizaciones_kit_id          on public.cotizaciones (kit_id);
create index idx_cotizaciones_fecha_emision   on public.cotizaciones (fecha_emision);
create index idx_cotizaciones_estado          on public.cotizaciones (estado);
create index idx_cot_det_cotizacion_id        on public.cotizacion_detalles (cotizacion_id);
create index idx_cot_det_producto_id          on public.cotizacion_detalles (producto_id);
create index idx_pedidos_cliente_id           on public.pedidos (cliente_id);
create index idx_pedidos_cotizacion_id        on public.pedidos (cotizacion_id);
-- Una cotización no puede generar más de un pedido (varias filas NULL ok)
create unique index idx_pedidos_cotizacion_id_unico
    on public.pedidos (cotizacion_id)
    where cotizacion_id is not null;
create index idx_pedidos_fecha_pedido         on public.pedidos (fecha_pedido);
create index idx_pedidos_estado               on public.pedidos (estado);
create index idx_ped_det_pedido_id            on public.pedido_detalles (pedido_id);
create index idx_ped_det_producto_id          on public.pedido_detalles (producto_id);
create index idx_alquileres_cliente_id        on public.alquileres (cliente_id);
create index idx_alquileres_maquinaria_id     on public.alquileres (maquinaria_id);
create index idx_alquileres_estado            on public.alquileres (estado);

-- ============================================================================
-- updated_at automático
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger trigger_productos_updated_at
before update on public.productos
for each row execute function public.set_updated_at();

create trigger trigger_kits_updated_at
before update on public.kits
for each row execute function public.set_updated_at();

create trigger trigger_maquinarias_updated_at
before update on public.maquinarias
for each row execute function public.set_updated_at();

create trigger trigger_cotizaciones_updated_at
before update on public.cotizaciones
for each row execute function public.set_updated_at();

create trigger trigger_pedidos_updated_at
before update on public.pedidos
for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security (RLS): activado en todas las tablas.
-- Las políticas se definirán en una fase posterior (env: FASE 26+).
-- ============================================================================
alter table public.categorias           enable row level security;
alter table public.productos            enable row level security;
alter table public.clientes             enable row level security;
alter table public.kits                 enable row level security;
alter table public.maquinarias          enable row level security;
alter table public.kit_productos        enable row level security;
alter table public.cotizaciones         enable row level security;
alter table public.cotizacion_detalles  enable row level security;
alter table public.pedidos              enable row level security;
alter table public.pedido_detalles      enable row level security;
alter table public.alquileres           enable row level security;