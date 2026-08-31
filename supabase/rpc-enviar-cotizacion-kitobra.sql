-- ============================================================================
-- FASE 34 - KitObra IA: guardar la recomendación editable como cotización
--
-- RPC SECURITY DEFINER: busca o crea el cliente por teléfono, crea la
-- cotización con estado 'nueva' y guarda cada ítem del kit (materiales,
-- herramientas, maquinaria) en cotizacion_detalles.
--
-- Vínculo con el catálogo:
--   Por cada ítem se busca el producto en public.productos por nombre
--   (sin distinguir mayúsculas, tildes ni espacios). Si existe, se guarda su
--   id en cotizacion_detalles.producto_id; si no, queda NULL (nullable).
--   Siempre se conservan descripcion y descripcion_producto como respaldo.
--
-- El total estimado es la suma de materiales + herramientas; la maquinaria
-- se registra para referencia sin sumar el alquiler, consistente con el
-- flujo KitObra IA ("No incluye alquiler de maquinaria").
--
-- p_area / p_presupuesto: área (m²) y presupuesto indicado en KitObra IA.
--
-- p_items: jsonb con arreglo de objetos:
--   { "tipo": "material"|"herramienta"|"maquinaria",
--     "producto_id": uuid|null (id real de public.productos, opcional),
--     "nombre": text, "cantidad": number, "unidad": text,
--     "precio": number|null, "descripcion": text|null }
-- Se usa producto_id si existe; si no, se resuelve por nombre.
-- El "tipo" y la "descripcion" del catálogo se guardan en
-- cotizacion_detalles.tipo / cotizacion_detalles.descripcion_producto.
-- ============================================================================

-- Función auxiliar de normalización (sin acentos, minúsculas, espacios únicos).
-- Usa translate() que es nativa (no requiere extensión unaccent).
create or replace function public.fn_normalizar_busqueda(p_texto text)
returns text
language sql
immutable
as $$
    select btrim(regexp_replace(
        lower(
            translate(
                coalesce(p_texto, ''),
                'áàäâãéèëêíìïîóòöôõúùüûñç',
                'aaaaaeeeeiiiiooooouuuunc'
            )
        ),
        '\s+',
        ' ',
        'g'
    ));
$$;

create or replace function public.enviar_cotizacion_kitobra(
    p_nombres       text,
    p_apellidos     text,
    p_telefono      text,
    p_email         text,
    p_tipo_obra     text,
    p_area          numeric,
    p_presupuesto   numeric,
    p_descripcion   text,
    p_observaciones text,
    p_items         jsonb
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
    v_total         numeric(12,2) := 0;
    v_item          jsonb;
    v_tipo          text;
    v_nombre        text;
    v_producto_id   uuid;
    v_cantidad      numeric(12,4);
    v_unidad        text;
    v_precio        numeric(12,2);
    v_subtotal      numeric(12,2);
begin
    -- Validar datos mínimos
    if btrim(coalesce(p_nombres, '') || ' ' || coalesce(p_apellidos, '')) = '' then
        raise exception 'Nombre y apellidos son requeridos.';
    end if;
    if btrim(coalesce(p_telefono, '')) = '' then
        raise exception 'Teléfono es requerido.';
    end if;
    if p_items is null or jsonb_array_length(p_items) = 0 then
        raise exception 'El kit está vacío.';
    end if;

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
            nullif(btrim(coalesce(p_email, '')), '')
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
        area, presupuesto, descripcion_obra, observaciones, total, estado
    )
    values (
        v_codigo, v_cliente_id, null, nullif(btrim(coalesce(p_tipo_obra, '')), ''),
        nullif(p_area, 0), nullif(p_presupuesto, 0),
        nullif(btrim(coalesce(p_descripcion, '')), ''),
        nullif(btrim(coalesce(p_observaciones, '')), ''),
        0, 'nueva'
    )
    returning id into v_cotizacion_id;

    -- 5. Guardar los ítems del kit
    for v_item in select * from jsonb_array_elements(p_items)
    loop
        v_tipo     := coalesce(v_item->>'tipo', 'material');
        v_nombre   := coalesce(v_item->>'nombre', '');
        v_cantidad := coalesce((v_item->>'cantidad')::numeric, 1);
        v_unidad   := coalesce(v_item->>'unidad', 'unidad');
        v_precio   := coalesce((nullif(v_item->>'precio', ''))::numeric, 0);
        v_subtotal := case
            when v_tipo = 'maquinaria' then 0
            else round(v_precio * v_cantidad, 2)
        end;

        -- Producto real enviado por el cliente (id del catálogo). Se valida
        -- que exista en public.productos; si no, se intenta resolver por nombre.
        v_producto_id := nullif(v_item->>'producto_id', '')::uuid;
        if v_producto_id is not null and not exists (
            select 1 from public.productos p where p.id = v_producto_id
        ) then
            v_producto_id := null;
        end if;

        -- Si no se pudo usar el id (no enviado o inexistente), buscar por
        -- nombre (coincidencia normalizada). Si no existe, producto_id queda NULL.
        if v_producto_id is null and v_nombre <> '' then
            select p.id into v_producto_id
            from public.productos p
            where public.fn_normalizar_busqueda(p.nombre) =
                  public.fn_normalizar_busqueda(v_nombre)
            limit 1;

            -- Fallback: coincidencia parcial si no hubo coincidencia exacta
            if v_producto_id is null then
                select p.id into v_producto_id
                from public.productos p
                where public.fn_normalizar_busqueda(p.nombre) like
                      '%' || public.fn_normalizar_busqueda(v_nombre) || '%'
                   or public.fn_normalizar_busqueda(v_nombre) like
                      '%' || public.fn_normalizar_busqueda(p.nombre) || '%'
                limit 1;
            end if;
        end if;

        insert into public.cotizacion_detalles (
            cotizacion_id, producto_id, descripcion,
            cantidad, unidad, precio_unitario, subtotal,
            tipo, descripcion_producto
        )
        values (
            v_cotizacion_id, v_producto_id,
            v_nombre,
            v_cantidad, v_unidad, v_precio, v_subtotal,
            case
                when v_tipo in ('herramienta', 'maquinaria') then v_tipo
                else 'material'
            end,
            nullif(coalesce(v_item->>'descripcion', ''), '')
        );

        v_total := v_total + v_subtotal;
    end loop;

    update public.cotizaciones
    set total = v_total
    where id = v_cotizacion_id;

    return v_codigo;
end;
$$;

-- Permitir solo su ejecución (no otras operaciones)
revoke all on function public.enviar_cotizacion_kitobra(text, text, text, text, text, numeric, numeric, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.enviar_cotizacion_kitobra(text, text, text, text, text, numeric, numeric, text, text, jsonb) to anon, authenticated;
