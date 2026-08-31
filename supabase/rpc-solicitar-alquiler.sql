-- ============================================================================
-- /maquinaria: envío público de solicitudes de alquiler
--
-- RPC SECURITY DEFINER: valida fechas, busca o crea el cliente por teléfono,
-- toma el precio_dia de la maquinaria, calcula días y total, y registra el
-- alquiler con estado 'solicitado' en una sola transacción. No expone las
-- tablas clientes/alquileres a usuarios anónimos.
--
-- El estado 'solicitado' ya está admitido por el CHECK vigente de
-- alquileres.estado (ver supabase/schema.sql).
-- ============================================================================

create or replace function public.solicitar_alquiler(
    p_nombre         text,
    p_telefono       text,
    p_maquinaria_id  uuid,
    p_fecha_inicio   date,
    p_fecha_fin      date,
    p_observaciones  text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente_id   uuid;
    v_precio_dia   numeric(12,2);
    v_dias         integer;
    v_total        numeric(12,2);
    v_codigo       text;
begin
    -- 1. Validaciones
    if nullif(btrim(p_nombre), '') is null then
        raise exception 'El nombre es obligatorio.';
    end if;

    if nullif(btrim(p_telefono), '') is null then
        raise exception 'El teléfono es obligatorio.';
    end if;

    if p_fecha_inicio is null or p_fecha_fin is null then
        raise exception 'Las fechas son obligatorias.';
    end if;

    if p_fecha_fin < p_fecha_inicio then
        raise exception 'La fecha fin no puede ser anterior a la fecha inicio.';
    end if;

    -- 2. Precio vigente de la maquinaria (no se confía en el cliente)
    select precio_dia into v_precio_dia
    from public.maquinarias
    where id = p_maquinaria_id;

    if v_precio_dia is null then
        raise exception 'La maquinaria seleccionada no existe.';
    end if;

    -- 3. Buscar cliente por teléfono
    select id into v_cliente_id
    from public.clientes
    where telefono = btrim(p_telefono)
    limit 1;

    -- 4. Si no existe, crearlo
    if v_cliente_id is null then
        insert into public.clientes (nombre, telefono)
        values (btrim(p_nombre), btrim(p_telefono))
        returning id into v_cliente_id;
    end if;

    -- 5. Días y total estimado (días inclusivos)
    v_dias := (p_fecha_fin - p_fecha_inicio) + 1;
    v_total := round(v_dias * v_precio_dia, 2);

    -- 6. Generar siguiente código ALQ-###
    select 'ALQ-' || lpad(
        (coalesce(max(substring(codigo from 'ALQ-(\d+)')::int), 0) + 1)::text,
        3,
        '0'
    )
    into v_codigo
    from public.alquileres;

    -- 7. Crear el alquiler con estado 'solicitado'
    insert into public.alquileres (
        codigo, cliente_id, maquinaria_id,
        fecha_inicio, fecha_fin, dias,
        precio_dia, total, estado, observaciones
    )
    values (
        v_codigo, v_cliente_id, p_maquinaria_id,
        p_fecha_inicio, p_fecha_fin, v_dias,
        v_precio_dia, v_total, 'solicitado',
        nullif(btrim(p_observaciones), '')
    );

    return v_codigo;
end;
$$;

-- Permitir solo su ejecución (no otras operaciones)
revoke all on function public.solicitar_alquiler(text, text, uuid, date, date, text) from public, anon, authenticated;
grant execute on function public.solicitar_alquiler(text, text, uuid, date, date, text) to anon, authenticated;