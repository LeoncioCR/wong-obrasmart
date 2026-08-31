-- ============================================================================
-- /cotizar: envío público de solicitudes de cotización
--
-- RPC SECURITY DEFINER: busca o crea el cliente por teléfono y registra la
-- cotización en una sola transacción, sin exponer la tabla clientes a
-- usuarios anónimos (RLS se mantiene admin-only en clientes/cotizaciones).
-- Si se elige un kit, copia sus productos a cotizacion_detalles (con precios
-- vigentes de productos.precio) y calcula cotizaciones.total.
--
-- El estado 'nueva' ya está admitido por el CHECK vigente de
-- cotizaciones.estado (ver supabase/schema.sql).
-- ============================================================================

create or replace function public.enviar_cotizacion(
    p_nombres      text,
    p_apellidos    text,
    p_telefono     text,
    p_email        text,
    p_tipo_obra    text,
    p_kit_id       uuid,
    p_descripcion  text,
    p_observaciones text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente_id    uuid;
    v_cotizacion_id uuid;
    v_codigo        text;
begin
    -- 1. Buscar cliente por teléfono
    select id into v_cliente_id
    from public.clientes
    where telefono = btrim(p_telefono)
    limit 1;

    -- 2. Si no existe, crearlo
    if v_cliente_id is null then
        insert into public.clientes (nombre, telefono, email)
        values (
            btrim(p_nombres) || ' ' || btrim(p_apellidos),
            btrim(p_telefono),
            nullif(btrim(p_email), '')
        )
        returning id into v_cliente_id;
    end if;

    -- 3. Generar siguiente código COT-###
    select 'COT-' || lpad(
        (coalesce(max(substring(codigo from 'COT-(\d+)')::int), 0) + 1)::text,
        3,
        '0'
    )
    into v_codigo
    from public.cotizaciones;

    -- 4. Crear la cotización con estado 'nueva'
    insert into public.cotizaciones (
        codigo, cliente_id, kit_id, tipo_obra,
        descripcion_obra, observaciones, estado
    )
    values (
        v_codigo, v_cliente_id, p_kit_id, btrim(p_tipo_obra),
        nullif(btrim(p_descripcion), ''),
        nullif(btrim(p_observaciones), ''),
        'nueva'
    )
    returning id into v_cotizacion_id;

    -- 5. Guardar los productos del kit (si se eligió) y calcular el total
    if p_kit_id is not null then
        insert into public.cotizacion_detalles (
            cotizacion_id, producto_id, descripcion,
            cantidad, unidad, precio_unitario, subtotal
        )
        select
            v_cotizacion_id,
            kp.producto_id,
            p.nombre,
            kp.cantidad,
            kp.unidad,
            p.precio,
            kp.cantidad * p.precio
        from public.kit_productos kp
        join public.productos p on p.id = kp.producto_id
        where kp.kit_id = p_kit_id;

        update public.cotizaciones
        set total = coalesce((
            select sum(subtotal)
            from public.cotizacion_detalles
            where cotizacion_id = v_cotizacion_id
        ), 0)
        where id = v_cotizacion_id;
    end if;

    return v_codigo;
end;
$$;

-- Permitir solo su ejecución (no otras operaciones)
revoke all on function public.enviar_cotizacion(text, text, text, text, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.enviar_cotizacion(text, text, text, text, text, uuid, text, text) to anon, authenticated;