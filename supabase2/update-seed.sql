-- ============================================================================
-- WONG ObraSmart - Actualización idempotente de datos maestros
--
-- Script seguro de actualización: NO borra datos existentes.
--   - Si el registro (por su UUID) NO existe -> se inserta.
--   - Si ya existe -> se actualiza (ON CONFLICT ... DO UPDATE).
--   - Mantiene los UUID fijos del seed original.
--
-- Actualiza: categorias, productos, kits, maquinarias, kit_productos.
-- NO toca: clientes, cotizaciones, pedidos, alquileres.
--
-- IMÁGENES: usa únicamente URLs en línea públicas (https://images.unsplash.com/...)
-- para productos.imagen y maquinarias.imagen. Sin rutas locales.
-- ============================================================================

begin;

-- ============================================================================
-- Asegurar UNIQUE (kit_id, producto_id) en kit_productos
-- Si la restricción no existe se crea; si ya existe, no hace nada.
-- Necesaria para poder usar ON CONFLICT con esa combinación.
-- ============================================================================
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.kit_productos'::regclass
          and contype = 'u'
          and conname = 'uk_kit_productos'
    ) then
        alter table public.kit_productos
            add constraint uk_kit_productos unique (kit_id, producto_id);
    end if;
end $$;

-- ============================================================================
-- Categorías
-- ============================================================================
insert into public.categorias (id, nombre, descripcion, estado) values
    ('a0000000-0000-4000-8000-000000000001', 'materiales', 'Materiales de construcción para obra.', 'activo'),
    ('a0000000-0000-4000-8000-000000000002', 'kits', 'Paquetes de materiales, herramientas y maquinaria listos para usar.', 'activo'),
    ('a0000000-0000-4000-8000-000000000003', 'maquinaria', 'Maquinaria y equipos para construcción.', 'activo')
on conflict (id) do update set
    nombre      = excluded.nombre,
    descripcion = excluded.descripcion,
    estado      = excluded.estado;

-- ============================================================================
-- Productos (imagen = URL en línea, coherente con cada producto)
-- ============================================================================
insert into public.productos
    (id, categoria_id, nombre, subcategoria, descripcion, precio, unidad, stock, imagen, estado) values
    ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Cemento Portland Tipo I (42.5 kg)', 'cemento',
     'Cemento de uso general para concreto, muros y elementos de albañilería.', 32.5, 'bolsa', 120, 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Arena gruesa', 'agregados',
     'Agregado fino lavado para mezclas de concreto y tarrajeo.', 85, 'm3', 40, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Ladrillo King Kong 18 huecos', 'ladrillos',
     'Ladrillo de arcilla para muros portantes y tabiques.', 1.2, 'unidad', 5000, 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Fierro corrugado 1/2" (9 m)', 'fierro',
     'Varilla de acero corrugado grado 60 para refuerzo estructural.', 48, 'varilla', 0, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=60', 'agotado'),
    ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'Kit Falso piso', 'agregados',
     'Cemento, arena y afirmado para preparar una base nivelada de falso piso.', 420, 'kit', 25, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'Kit Tarrajeo', 'agregados',
     'Materiales para tarrajeo liso de muros: arena fina, cemento y herramientas básicas.', 380, 'kit', 18, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'bajo stock'),
    ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 'Kit Muro', 'ladrillos',
     'Ladrillos, cemento y arena para levantar muros resistentes.', 560, 'kit', 30, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000002', 'Kit Vereda', 'agregados',
     'Concreto, encofrado y refuerzos para veredas y sardineles.', 640, 'kit', 12, 'https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000003', 'Mezcladora de concreto 9 p3', 'herramientas',
     'Mezcladora eléctrica de concreto para obras pequeñas y medianas.', 65, 'día', 8, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003', 'Vibrador de concreto', 'herramientas',
     'Equipo de vibrado para compactar concreto en estructuras.', 45, 'día', 0, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=60', 'agotado'),
    ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'Regla vibratoria 3 m', 'herramientas',
     'Regla vibratoria para nivelar y alisar losas de concreto.', 55, 'día', 6, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'bajo stock'),
    ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000001', 'Carretilla de obra 60 L', 'herramientas',
     'Carretilla reforzada para el transporte de mezclas y materiales en obra.', 95, 'unidad', 15, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000001', 'Lampa y barreta (par)', 'herramientas',
     'Herramientas manuales de acero para excavación y preparación de mezclas.', 35, 'par', 40, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000001', 'Pintura látex blanco (4 gal)', 'pintura',
     'Pintura látex lavable para muros interiores y exteriores.', 210, 'balde', 22, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', 'Imprimante para muros (1 gal)', 'pintura',
     'Sellador e imprimante para preparar superficies antes de pintar.', 55, 'galón', 18, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=60', 'bajo stock'),
    ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000001', 'Tubería PVC presión 1/2" (3 m)', 'tuberias',
     'Tubería PVC para instalaciones de agua fría y riego.', 18, 'unidad', 60, 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000001', 'Codo PVC 1/2"', 'tuberias',
     'Accesorio de 90° para cambios de dirección en tuberías de agua.', 3.5, 'unidad', 200, 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000001', 'Arena fina', 'agregados',
     'Agregado fino lavado para tarrajeo y acabados.', 85, 'm3', 30, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000001', 'Afirmado o piedra', 'agregados',
     'Material de base para preparación y nivelación de terrenos.', 45, 'm3', 25, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000001', 'Piedra chancada 1/2"', 'agregados',
     'Agregado grueso para concreto estructural.', 120, 'm3', 20, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000001', 'Impermeabilizante', 'pintura',
     'Aditivo impermeabilizante para morteros y acabados.', 18, 'kg', 40, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000001', 'Fierro corrugado 3/8" (9 m)', 'fierro',
     'Varilla de acero corrugado para refuerzo de veredas y sardineles.', 42, 'varilla', 0, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=60', 'agotado'),
    ('b0000000-0000-4000-8000-000000000023', 'a0000000-0000-4000-8000-000000000001', 'Nivel de mano', 'herramientas',
     'Nivel de burbuja para alineación y verificaciones en obra.', 18, 'unidad', 25, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000024', 'a0000000-0000-4000-8000-000000000001', 'Plomada', 'herramientas',
     'Plomada metálica para trasladar niveles y plomos en obra.', 9, 'unidad', 30, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000025', 'a0000000-0000-4000-8000-000000000001', 'Cordel y regla', 'herramientas',
     'Juego de cordel y regla para trazados en obra.', 12, 'juego', 15, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000026', 'a0000000-0000-4000-8000-000000000001', 'Badilejo', 'herramientas',
     'Herramienta de acero para aplicación y acabado de mortero.', 15, 'unidad', 30, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000027', 'a0000000-0000-4000-8000-000000000001', 'Plancha de acabado', 'herramientas',
     'Plancha de acero inoxidable para acabado liso de muros.', 22, 'unidad', 18, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000028', 'a0000000-0000-4000-8000-000000000001', 'Falsa escuadra', 'herramientas',
     'Escuadra ajustable para verificación de ángulos en obra.', 14, 'unidad', 20, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000029', 'a0000000-0000-4000-8000-000000000001', 'Regla de aluminio', 'herramientas',
     'Regla de aluminio para nivelación y pañeteo de superficies.', 28, 'unidad', 12, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000030', 'a0000000-0000-4000-8000-000000000001', 'Andamio metálico', 'herramientas',
     'Panel de andamio metálico para trabajos en altura.', 60, 'panel', 10, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000031', 'a0000000-0000-4000-8000-000000000001', 'Brochas y rodillos', 'herramientas',
     'Juego de brochas y rodillos para pintura en obra.', 35, 'juego', 25, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000032', 'a0000000-0000-4000-8000-000000000001', 'Cinta métrica', 'herramientas',
     'Cinta métrica de 5 m para mediciones en obra.', 8, 'unidad', 40, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60', 'disponible'),
    ('b0000000-0000-4000-8000-000000000033', 'a0000000-0000-4000-8000-000000000003', 'Batidora para pintura', 'herramientas',
     'Batidora eléctrica para preparación de pintura y mezclas.', 50, 'día', 5, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=400&q=60', 'disponible')
on conflict (id) do update set
    categoria_id = excluded.categoria_id,
    nombre       = excluded.nombre,
    subcategoria = excluded.subcategoria,
    descripcion  = excluded.descripcion,
    precio       = excluded.precio,
    unidad       = excluded.unidad,
    stock        = excluded.stock,
    imagen       = excluded.imagen,
    estado       = excluded.estado,
    updated_at   = now();

-- ============================================================================
-- Kits
-- ============================================================================
insert into public.kits (id, nombre, descripcion, tipo_obra, precio_referencial, estado) values
    ('c0000000-0000-4000-8000-000000000001', 'Falso piso',
     'Materiales para preparar una base nivelada y lista para el acabado de tu piso.',
     'Nivelación y base de pisos', 425, 'activo'),
    ('c0000000-0000-4000-8000-000000000002', 'Tarrajeo',
     'Todo lo necesario para el acabado de muros y superficies con tarrajeo liso.',
     'Acabado de muros y superficies', 385, 'activo'),
    ('c0000000-0000-4000-8000-000000000003', 'Muro',
     'Bloques, ladrillos, cemento y arena para levantar muros resistentes.',
     'Construcción de muros', 565, 'activo'),
    ('c0000000-0000-4000-8000-000000000004', 'Vereda',
     'Concreto, encofrado y refuerzos para veredas y sardineles bien terminados.',
     'Veredas y sardineles', 645, 'activo'),
    ('c0000000-0000-4000-8000-000000000005', 'Remodelación menor',
     'Lo esencial para renovar espacios pequeños sin detener tu día a día.',
     'Remodelación y mantenimiento', 480, 'activo')
on conflict (id) do update set
    nombre             = excluded.nombre,
    descripcion        = excluded.descripcion,
    tipo_obra          = excluded.tipo_obra,
    precio_referencial = excluded.precio_referencial,
    estado             = excluded.estado,
    updated_at         = now();

-- ============================================================================
-- Maquinaria (imagen = URL en línea, coherente con cada máquina)
-- ============================================================================
insert into public.maquinarias (id, nombre, descripcion, precio_dia, disponible, imagen) values
    ('d0000000-0000-4000-8000-000000000001', 'Mezcladora',
     'Mezcladora de concreto eléctrica, ideal para mezclas de hasta 9 pies cúbicos.', 65, true, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=60'),
    ('d0000000-0000-4000-8000-000000000002', 'Compactadora',
     'Compactadora tipo canguro para nivelar y compactar terrenos y bases.', 80, true, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=60'),
    ('d0000000-0000-4000-8000-000000000003', 'Rotomartillo',
     'Rotomartillo para perforación de concreto, muros y superficies duras.', 40, false, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=60'),
    ('d0000000-0000-4000-8000-000000000004', 'Demoledor',
     'Martillo demoledor para remover concreto, demoliciones y trabajos pesados.', 55, true, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=60'),
    ('d0000000-0000-4000-8000-000000000005', 'Cortadora',
     'Cortadora de piso y concreto para cortes precisos en losas y veredas.', 70, false, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=60')
on conflict (id) do update set
    nombre      = excluded.nombre,
    descripcion = excluded.descripcion,
    precio_dia  = excluded.precio_dia,
    disponible  = excluded.disponible,
    imagen      = excluded.imagen,
    updated_at  = now();

-- ============================================================================
-- kit_productos: composición de cada kit (material / herramienta / maquinaria)
-- Se usa ON CONFLICT (kit_id, producto_id) para no duplicar la relación.
-- ============================================================================
insert into public.kit_productos (kit_id, producto_id, tipo, cantidad, unidad) values
    -- Kit 1: Falso piso
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'material', 6, 'bolsas'),
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 'material', 0.8, 'm3'),
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000019', 'material', 0.6, 'm3'),
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000023', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000013', 'herramienta', 1, 'par'),
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000025', 'herramienta', 1, 'juego'),
    ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000009', 'maquinaria', 1, 'día'),

    -- Kit 2: Tarrajeo
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'material', 5, 'bolsas'),
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000018', 'material', 0.7, 'm3'),
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000021', 'material', 2, 'kg'),
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000026', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000027', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000028', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000009', 'maquinaria', 1, 'día'),

    -- Kit 3: Muro
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 'material', 850, 'unidades'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'material', 8, 'bolsas'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 'material', 1.2, 'm3'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000026', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000024', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000023', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000009', 'maquinaria', 1, 'día'),
    ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000030', 'maquinaria', 2, 'paneles'),

    -- Kit 4: Vereda
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'material', 10, 'bolsas'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'material', 1, 'm3'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000020', 'material', 1.2, 'm3'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000022', 'material', 9, 'varillas'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000029', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000013', 'herramienta', 1, 'par'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000023', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000009', 'maquinaria', 1, 'día'),
    ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000010', 'maquinaria', 1, 'día'),

    -- Kit 5: Remodelación menor
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000014', 'material', 2, 'baldes'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'material', 3, 'bolsas'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000018', 'material', 0.3, 'm3'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000016', 'material', 4, 'unidades'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000031', 'herramienta', 1, 'juego'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000026', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000032', 'herramienta', 1, 'unidad'),
    ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000033', 'maquinaria', 1, 'día')
on conflict (kit_id, producto_id) do update set
    tipo     = excluded.tipo,
    cantidad = excluded.cantidad,
    unidad   = excluded.unidad;

commit;
