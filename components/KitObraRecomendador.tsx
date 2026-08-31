"use client";

import { useMemo, useState } from "react";
import {
  errorClasses,
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";
import {
  obtenerRecomendacion,
  tiposObra,
  type MaterialRecomendado,
  type ObraDatos,
  type RecomendacionObra,
  type TipoObra,
} from "@/lib/kitobra";
import { getSupabase } from "@/lib/supabase/client";
import { productos } from "@/data/productos";

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const unidadesEnteras = new Set([
  "unidad",
  "bolsa",
  "varilla",
  "par",
  "día",
  "galón",
]);

const pasoPorUnidad = (unidad: string): number =>
  unidadesEnteras.has(unidad) ? 1 : 0.5;

const cantidadTexto = (cantidad: number): string =>
  cantidad.toLocaleString("es-PE", { maximumFractionDigits: 2 });

const redondearCantidad = (valor: number): number =>
  Math.round(valor * 10) / 10;

const redondearPrecio = (valor: number): number =>
  Math.round(valor * 100) / 100;

export default function KitObraRecomendador() {
  const [tipoObra, setTipoObra] = useState("");
  const [area, setArea] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [necesitaHerramientas, setNecesitaHerramientas] = useState(true);
  const [necesitaMaquinaria, setNecesitaMaquinaria] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [errorForm, setErrorForm] = useState("");
  const [generando, setGenerando] = useState(false);
  const [recomendacion, setRecomendacion] = useState<RecomendacionObra | null>(
    null
  );
  const [agregandoProducto, setAgregandoProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadManual, setCantidadManual] = useState("1");
  const [unidadManual, setUnidadManual] = useState("");
  const [precioManual, setPrecioManual] = useState("");
  const [errorManual, setErrorManual] = useState("");

  const [mostrarCotizacion, setMostrarCotizacion] = useState(false);
  const [cotizarNombre, setCotizarNombre] = useState("");
  const [cotizarApellido, setCotizarApellido] = useState("");
  const [cotizarTelefono, setCotizarTelefono] = useState("");
  const [cotizarEmail, setCotizarEmail] = useState("");
  const [cotizarObservaciones, setCotizarObservaciones] = useState("");
  const [errorCotizar, setErrorCotizar] = useState("");
  const [enviandoCotizacion, setEnviandoCotizacion] = useState(false);
  const [codigoCreado, setCodigoCreado] = useState("");

  const precioMateriales = useMemo(
    () =>
      recomendacion?.materiales.reduce(
        (suma, m) => suma + (m.precio ?? 0) * m.cantidad,
        0
      ) ?? 0,
    [recomendacion]
  );

  const precioHerramientas = useMemo(
    () =>
      recomendacion?.herramientas.reduce(
        (suma, h) => suma + (h.precio ?? 0),
        0
      ) ?? 0,
    [recomendacion]
  );

  const precioTotal = redondearPrecio(precioMateriales + precioHerramientas);

  const presupuestoReferencial =
    presupuesto.trim() !== "" ? Number(presupuesto) : null;

  const superaPresupuesto =
    presupuestoReferencial !== null && precioTotal > presupuestoReferencial;

  const generar = () => {
    const areaNum = Number(area);
    if (!tipoObra) {
      setErrorForm("Selecciona un tipo de obra.");
      return;
    }
    if (!area.trim() || !Number.isFinite(areaNum) || areaNum <= 0) {
      setErrorForm("Ingresa una medida aproximada de la zona en m².");
      return;
    }
    let presupuestoNum: number | null = null;
    if (presupuesto.trim() !== "") {
      presupuestoNum = Number(presupuesto);
      if (!Number.isFinite(presupuestoNum) || presupuestoNum <= 0) {
        setErrorForm("Ingresa un presupuesto aproximado válido (opcional).");
        return;
      }
    }
    setErrorForm("");
    setGenerando(true);
    const datos: ObraDatos = {
      tipoObra: tipoObra as TipoObra,
      area: areaNum,
      presupuesto: presupuestoNum,
      necesitaHerramientas,
      necesitaMaquinaria,
      observaciones: observaciones.trim(),
    };
    void obtenerRecomendacion(datos)
      .then((rec) => setRecomendacion(rec))
      .catch(() => setErrorForm("No se pudo generar la recomendación."))
      .finally(() => setGenerando(false));
  };

  const cambiarCantidad = (idMaterial: string, delta: number) => {
    setRecomendacion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        materiales: prev.materiales.map((material) => {
          if (material.id !== idMaterial) return material;
          const paso = pasoPorUnidad(material.unidad);
          const minimo = unidadesEnteras.has(material.unidad) ? 1 : 0.5;
          return {
            ...material,
            cantidad: Math.max(minimo, redondearCantidad(material.cantidad + paso * delta)),
          };
        }),
      };
    });
  };

  const quitarMaterial = (idMaterial: string) => {
    setRecomendacion((prev) => {
      if (!prev) return prev;
      return { ...prev, materiales: prev.materiales.filter((m) => m.id !== idMaterial) };
    });
  };

  const quitarHerramienta = (idHerramienta: string) => {
    setRecomendacion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        herramientas: prev.herramientas.filter((h) => h.id !== idHerramienta),
      };
    });
  };

  const quitarMaquinaria = (idMaquinaria: string) => {
    setRecomendacion((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        maquinaria: prev.maquinaria.filter((mq) => mq.id !== idMaquinaria),
      };
    });
  };

  const productoManual =
    productos.find((p) => p.id === productoSeleccionado) ?? null;

  const seleccionarProductoManual = (id: string) => {
    setProductoSeleccionado(id);
    const producto = productos.find((p) => p.id === id);
    if (producto) {
      setUnidadManual(producto.unidad);
      setPrecioManual(String(producto.precio));
    }
    setCantidadManual("1");
    setErrorManual("");
  };

  const agregarProductoManual = () => {
    if (!productoManual) {
      setErrorManual("Selecciona un producto del catálogo.");
      return;
    }
    const cantidad = Number(cantidadManual);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setErrorManual("Ingresa una cantidad válida.");
      return;
    }
    const precio =
      precioManual.trim() === "" || !Number.isFinite(Number(precioManual))
        ? null
        : redondearPrecio(Number(precioManual));
    setRecomendacion((prev) => {
      if (!prev) return prev;
      const nuevo: MaterialRecomendado = {
        id: productoManual.id,
        nombre: productoManual.nombre,
        descripcion: productoManual.descripcion,
        cantidad: redondearCantidad(cantidad),
        unidad: unidadManual.trim() || productoManual.unidad,
        precio,
      };
      const existente = prev.materiales.find((m) => m.id === productoManual.id);
      const materiales = existente
        ? prev.materiales.map((m) =>
            m.id === existente.id
              ? {
                  ...m,
                  cantidad: redondearCantidad(m.cantidad + nuevo.cantidad),
                }
              : m
          )
        : [...prev.materiales, nuevo];
      return { ...prev, materiales };
    });
    setAgregandoProducto(false);
    setProductoSeleccionado("");
    setUnidadManual("");
    setPrecioManual("");
    setCantidadManual("1");
    setErrorManual("");
  };

  const cotizarKit = async () => {
    if (!recomendacion || enviandoCotizacion) return;
    if (!cotizarNombre.trim() || !cotizarApellido.trim()) {
      setErrorCotizar("Ingresa tus nombres y apellidos.");
      return;
    }
    const telefonoDigitos = cotizarTelefono.replace(/\D/g, "");
    if (telefonoDigitos.length < 9 || telefonoDigitos.length > 12) {
      setErrorCotizar("Ingresa un teléfono válido (9 a 12 dígitos).");
      return;
    }
    const email = cotizarEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorCotizar("Ingresa un email válido.");
      return;
    }
    setErrorCotizar("");
    setEnviandoCotizacion(true);

    const items = [
      ...recomendacion.materiales.map((m) => ({
        tipo: "material",
        nombre: m.nombre,
        cantidad: m.cantidad,
        unidad: m.unidad,
        precio: m.precio,
        descripcion: m.descripcion,
      })),
      ...recomendacion.herramientas.map((h) => ({
        tipo: "herramienta",
        nombre: h.nombre,
        cantidad: 1,
        unidad: "unidad",
        precio: h.precio,
      })),
      ...recomendacion.maquinaria.map((mq) => ({
        tipo: "maquinaria",
        nombre: mq.nombre,
        cantidad: 1,
        unidad: "día",
        precio: mq.precioDia,
      })),
    ];

    try {
      const { data, error } = await getSupabase().rpc(
        "enviar_cotizacion_kitobra",
        {
          p_nombres: cotizarNombre.trim(),
          p_apellidos: cotizarApellido.trim(),
          p_telefono: telefonoDigitos,
          p_email: email,
          p_tipo_obra: recomendacion.tipoObra,
          p_area: recomendacion.area,
          p_presupuesto: presupuestoReferencial,
          p_descripcion: recomendacion.alcance,
          p_observaciones:
            cotizarObservaciones.trim() || recomendacion.observaciones || "",
          p_items: items,
        }
      );
      if (error) {
        setErrorCotizar(
          /PGRST202/i.test(error.message) ||
            error.message.includes("Could not find the function")
            ? "El servidor aún no tiene la función de cotización de kits. Aplica la migración supabase/rpc-enviar-cotizacion-kitobra.sql en Supabase."
            : error.message
        );
        return;
      }
      setCodigoCreado(String(data ?? ""));
      setMostrarCotizacion(false);
    } catch {
      setErrorCotizar("No se pudo registrar la cotización.");
    } finally {
      setEnviandoCotizacion(false);
    }
  };

  const reiniciarCotizacion = () => {
    setMostrarCotizacion(false);
    setCodigoCreado("");
    setCotizarNombre("");
    setCotizarApellido("");
    setCotizarTelefono("");
    setCotizarEmail("");
    setCotizarObservaciones("");
    setErrorCotizar("");
  };

  const reiniciar = () => {
    reiniciarCotizacion();
    setRecomendacion(null);
  };

  return (
    <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          KitObra IA
        </span>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {recomendacion ? "Tu recomendación personalizada" : "¿No sabes qué kit elegir?"}
        </h2>
      </div>

      {!recomendacion ? (
        <div className="mt-5">
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Cuéntanos el tipo de obra y su tamaño y generaremos una
            recomendación referencial de materiales, herramientas, maquinaria y
            precio estimado.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block">
                <span className={labelClasses}>Tipo de obra</span>
                <select
                  value={tipoObra}
                  onChange={(e) => setTipoObra(e.target.value)}
                  className={`${inputClasses} dark:[color-scheme:dark]`}
                >
                  <option value="" disabled>
                    Selecciona un tipo de obra
                  </option>
                  {tiposObra.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className={labelClasses}>
                Medida aproximada (m²) <span className="text-red-600">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej. 20"
                className={inputClasses}
              />
            </label>

            <label className="block">
              <span className={labelClasses}>
                Presupuesto aproximado (S/) <span className="text-zinc-400">opcional</span>
              </span>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                placeholder="Ej. 1200"
                className={inputClasses}
              />
            </label>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={necesitaHerramientas}
                  onChange={(e) => setNecesitaHerramientas(e.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                Necesito sugerencias de herramientas
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={necesitaMaquinaria}
                  onChange={(e) => setNecesitaMaquinaria(e.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                Necesito sugerencias de maquinaria
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block">
                <span className={labelClasses}>
                  Observaciones <span className="text-zinc-400">opcional</span>
                </span>
                <textarea
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. Proyecto para una tienda pequeña, entrega en 2 semanas."
                  className={textareaClasses}
                />
              </label>
            </div>
          </div>

          {errorForm ? <p className={`${errorClasses} mt-4`}>{errorForm}</p> : null}

          <button
            type="button"
            onClick={generar}
            disabled={generando}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generando ? "Generando..." : "Generar recomendación IA"}
          </button>

          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Precios referenciales (modo demostración).
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {recomendacion.tipoObra}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {cantidadTexto(recomendacion.area)} m²
            </span>
            {presupuestoReferencial !== null && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Presupuesto: {formatPrecio.format(presupuestoReferencial)}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {recomendacion.alcance} Ajusta la lista y el total se actualizará
            automáticamente.
          </p>
          {recomendacion.fuente === "local" && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              No se pudo conectar con KitObra IA (verifica GROQ_API_KEY); se
              muestra una recomendación referencial local.
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                Materiales sugeridos
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {recomendacion.materiales.map((material) => {
                  const subtotal =
                    material.precio !== null
                      ? redondearPrecio(material.precio * material.cantidad)
                      : null;
                  const minimo = unidadesEnteras.has(material.unidad) ? 1 : 0.5;
                  return (
                    <li
                      key={material.id}
                      className="flex items-center gap-3 border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800/60"
                    >
                      <button
                        type="button"
                        onClick={() => quitarMaterial(material.id)}
                        aria-label={`Quitar ${material.nombre}`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                      >
                        ×
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                          {material.nombre}
                        </p>
                        {material.descripcion ? (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {material.descripcion}
                          </p>
                        ) : null}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {material.precio !== null
                            ? `${formatPrecio.format(material.precio)} / ${material.unidad}`
                            : `s/precio disponible / ${material.unidad}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(material.id, -1)}
                          disabled={material.cantidad <= minimo}
                          aria-label={`Reducir ${material.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          −
                        </button>
                        <span className="w-14 text-center text-sm text-zinc-700 dark:text-zinc-300">
                          {cantidadTexto(material.cantidad)} {material.unidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(material.id, 1)}
                          aria-label={`Aumentar ${material.nombre}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-20 shrink-0 text-right font-medium text-zinc-900 dark:text-zinc-50">
                        {subtotal !== null ? formatPrecio.format(subtotal) : "—"}
                      </span>
                    </li>
                  );
})}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setAgregandoProducto((v) => !v);
                  setErrorManual("");
                }}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {agregandoProducto ? "Cancelar" : "+ Agregar producto"}
              </button>

              {agregandoProducto && (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Agregar producto del catálogo
                  </p>
                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <span className={labelClasses}>Producto</span>
                      <select
                        value={productoSeleccionado}
                        onChange={(e) => seleccionarProductoManual(e.target.value)}
                        className={`${inputClasses} dark:[color-scheme:dark]`}
                      >
                        <option value="" disabled>
                          Selecciona un producto
                        </option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.unidad})
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className={labelClasses}>Cantidad</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={cantidadManual}
                          onChange={(e) => setCantidadManual(e.target.value)}
                          className={inputClasses}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClasses}>Unidad</span>
                        <input
                          type="text"
                          value={unidadManual}
                          onChange={(e) => setUnidadManual(e.target.value)}
                          className={inputClasses}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClasses}>
                          Precio (S/) <span className="text-zinc-400">opcional</span>
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={precioManual}
                          onChange={(e) => setPrecioManual(e.target.value)}
                          className={inputClasses}
                        />
                      </label>
                    </div>
                    {errorManual ? (
                      <p className={errorClasses}>{errorManual}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={agregarProductoManual}
                      className="inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                    >
                      Agregar al kit
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                  Herramientas sugeridas
                </h3>
                {recomendacion.herramientas.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    No se sugieren herramientas.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {recomendacion.herramientas.map((herramienta) => (
                      <li
                        key={herramienta.id}
                        className={`flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 ${
                          herramienta.precio !== null ? "pr-2" : ""
                        } dark:bg-zinc-800 dark:text-zinc-400`}
                      >
                        {herramienta.nombre}
                        {herramienta.precio !== null && (
                          <span className="text-zinc-500 dark:text-zinc-500">
                            {formatPrecio.format(herramienta.precio)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => quitarHerramienta(herramienta.id)}
                          aria-label={`Quitar ${herramienta.nombre}`}
                          className="ml-1 text-zinc-400 transition-colors hover:text-red-600"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                  Maquinaria sugerida
                </h3>
                {recomendacion.maquinaria.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                    No requiere maquinaria para este tipo de obra.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {recomendacion.maquinaria.map((equipo) => (
                      <li
                        key={equipo.id}
                        className="flex items-center gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => quitarMaquinaria(equipo.id)}
                          aria-label={`Quitar ${equipo.nombre}`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                        >
                          ×
                        </button>
                        <span className="flex-1 text-zinc-700 dark:text-zinc-300">
                          {equipo.nombre}
                        </span>
                        <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
                          {equipo.precioDia !== null
                            ? `${formatPrecio.format(equipo.precioDia)}/día`
                            : "s/precio disponible"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Precio estimado
                </p>
                <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {formatPrecio.format(precioTotal)}
                </p>
                <div className="mt-2 space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <p>Materiales: {formatPrecio.format(precioMateriales)}</p>
                  <p>Herramientas: {formatPrecio.format(precioHerramientas)}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  No incluye alquiler de maquinaria.
                </p>
                {superaPresupuesto && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    La recomendación supera tu presupuesto aproximado.
                  </p>
                )}
              </div>
            </div>

            {recomendacion.observaciones ? (
              <p className="text-xs italic text-zinc-500 md:col-span-2 dark:text-zinc-400">
                Consideraciones: {recomendacion.observaciones}
              </p>
            ) : null}
          </div>

          {codigoCreado ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                Cotización registrada correctamente.
              </h3>
              <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                Quedó registrada con el código{" "}
                <span className="font-semibold">{codigoCreado}</span> y estado
                &quot;nueva&quot;. Un representante revisará tu solicitud y se
                comunicará contigo en breve.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={reiniciarCotizacion}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  Enviar otra solicitud
                </button>
                <button
                  type="button"
                  onClick={reiniciar}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-300 px-6 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                >
                  Volver a generar
                </button>
              </div>
            </div>
          ) : mostrarCotizacion ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                cotizarKit();
              }}
              className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                Cotizar kit
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Indica tus datos y registraremos la cotización de este kit con
                sus materiales, herramientas, maquinaria y total estimado.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClasses}>Nombres</span>
                  <input
                    type="text"
                    value={cotizarNombre}
                    onChange={(e) => setCotizarNombre(e.target.value)}
                    placeholder="Ej. María Fernanda"
                    className={inputClasses}
                  />
                </label>
                <label className="block">
                  <span className={labelClasses}>Apellidos</span>
                  <input
                    type="text"
                    value={cotizarApellido}
                    onChange={(e) => setCotizarApellido(e.target.value)}
                    placeholder="Ej. López Ramírez"
                    className={inputClasses}
                  />
                </label>
                <label className="block">
                  <span className={labelClasses}>Teléfono</span>
                  <input
                    type="tel"
                    value={cotizarTelefono}
                    onChange={(e) => setCotizarTelefono(e.target.value)}
                    placeholder="Ej. 987 654 321"
                    className={inputClasses}
                  />
                </label>
                <label className="block">
                  <span className={labelClasses}>
                    Email <span className="text-zinc-400">(opcional)</span>
                  </span>
                  <input
                    type="email"
                    value={cotizarEmail}
                    onChange={(e) => setCotizarEmail(e.target.value)}
                    placeholder="Ej. nombre@correo.com"
                    className={inputClasses}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClasses}>
                    Observaciones <span className="text-zinc-400">(opcional)</span>
                  </span>
                  <textarea
                    rows={3}
                    value={cotizarObservaciones}
                    onChange={(e) => setCotizarObservaciones(e.target.value)}
                    placeholder="Indicaciones adicionales, por ejemplo fechas o lugar de entrega."
                    className={textareaClasses}
                  />
                </label>
              </div>

              {errorCotizar ? (
                <p className={`${errorClasses} mt-3`}>{errorCotizar}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={enviandoCotizacion}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviandoCotizacion
                    ? "Guardando..."
                    : "Confirmar cotización"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarCotizacion(false);
                    setErrorCotizar("");
                  }}
                  disabled={enviandoCotizacion}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrorCotizar("");
                  setCodigoCreado("");
                  setMostrarCotizacion(true);
                }}
                className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Cotizar kit
              </button>
              <button
                type="button"
                onClick={reiniciar}
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Volver a generar
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}