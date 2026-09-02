"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type EstadoCotizacion =
  | "nueva"
  | "en_revision"
  | "cotizada"
  | "aceptada"
  | "rechazada";

const estados: EstadoCotizacion[] = [
  "nueva",
  "en_revision",
  "cotizada",
  "aceptada",
  "rechazada",
];

interface ItemDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  descripcionProducto: string | null;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
  tipo: "material" | "herramienta" | "maquinaria";
}

interface DetalleCotizacion {
  codigo: string;
  cliente: {
    nombre: string;
    telefono: string;
    email: string | null;
    direccion: string | null;
  } | null;
  tipoObra: string;
  kit: string | null;
  area: number | null;
  presupuesto: number | null;
  fecha: string;
  descripcionObra: string | null;
  estado: EstadoCotizacion;
  observaciones: string | null;
  total: number;
  items: ItemDetalle[];
}

interface FilaCotizacion {
  id: string;
  codigo: string;
  tipo_obra: string;
  area: number | null;
  presupuesto: number | null;
  descripcion_obra: string | null;
  observaciones: string | null;
  total: number;
  fecha_emision: string;
  estado: EstadoCotizacion;
  clientes: {
    nombre: string;
    telefono: string;
    email: string | null;
    direccion: string | null;
  } | null;
  kits: { nombre: string } | null;
  cotizacion_detalles: {
    id: string;
    descripcion: string;
    cantidad: number;
    unidad: string;
    precio_unitario: number;
    subtotal: number;
    tipo: "material" | "herramienta" | "maquinaria" | null;
    descripcion_producto: string | null;
    productos: { nombre: string } | null;
  }[];
}

const estadoClases: Record<EstadoCotizacion, string> = {
  nueva: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  en_revision:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  cotizada: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  aceptada:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  rechazada: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const estadoLabels: Record<EstadoCotizacion, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  cotizada: "Cotizada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const formatCantidad = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

const formatPrecio00 = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const obtenerFecha = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fetchCotizacion = (codigo: string) =>
  getSupabase()
    .from("cotizaciones")
    .select(
      "id, codigo, tipo_obra, area, presupuesto, descripcion_obra, observaciones, total, fecha_emision, estado, clientes(nombre, telefono, email, direccion), kits(nombre), cotizacion_detalles(id, descripcion, descripcion_producto, cantidad, unidad, precio_unitario, subtotal, tipo, productos(nombre))"
    )
    .eq("codigo", codigo)
    .maybeSingle();

function TablaDetalleItem({
  items,
  vacio,
}: {
  items: ItemDetalle[];
  vacio: string;
}) {
  if (items.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
        {vacio}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <th className="sticky left-0 z-10 px-6 py-3 font-medium">
              Tipo
            </th>
            <th className="px-6 py-3 font-medium">Descripción</th>
            <th className="px-6 py-3 font-medium">Desc. producto</th>
            <th className="px-6 py-3 font-medium">Cantidad</th>
            <th className="px-6 py-3 font-medium">Unidad</th>
            <th className="px-6 py-3 font-medium">Precio unitario</th>
            <th className="px-6 py-3 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const tipoLabel =
              item.tipo === "material"
                ? "Material"
                : item.tipo === "herramienta"
                  ? "Herramienta"
                  : "Maquinaria";
            return (
              <tr
                key={item.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
              >
                <td className="sticky left-0 bg-white px-6 py-3 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  {tipoLabel}
                </td>
                <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {item.nombre}
                </td>
                <td className="max-w-[280px] px-6 py-3 text-zinc-600 dark:text-zinc-400">
                  {item.descripcionProducto ?? "—"}
                </td>
                <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatCantidad.format(item.cantidad)}
                </td>
                <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                  {item.unidad}
                </td>
                <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                  {formatPrecio.format(item.precio_unitario)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {formatPrecio00.format(item.subtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Cargando cotización...
          </p>
        </div>
      }
    >
      <CotizacionDetalle params={params} />
    </Suspense>
  );
}

function CotizacionDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <DetalleContenido codigo={id} />;
}

function DetalleContenido({ codigo }: { codigo: string }) {
  const [cargando, setCargando] = useState(true);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [detalle, setDetalle] = useState<DetalleCotizacion | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchCotizacion(codigo))
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorCarga(error.message);
          setCargando(false);
          return;
        }
        if (!data) {
          setNoEncontrada(true);
          setCargando(false);
          return;
        }
        const fila = data as unknown as FilaCotizacion;
        const items: ItemDetalle[] = (fila.cotizacion_detalles ?? []).map(
          (d) => {
            let tipo: ItemDetalle["tipo"] = d.tipo ?? "material";
            let nombre = d.productos?.nombre ?? d.descripcion;
            if (tipo === "material") {
              if (d.descripcion.startsWith("Herramienta: ")) {
                tipo = "herramienta";
                nombre = d.productos?.nombre ?? d.descripcion.slice("Herramienta: ".length);
              } else if (d.descripcion.startsWith("Maquinaria: ")) {
                tipo = "maquinaria";
                nombre = d.productos?.nombre ?? d.descripcion.slice("Maquinaria: ".length);
              }
            }
            return {
              id: d.id,
              nombre,
              descripcion: d.descripcion,
              descripcionProducto: d.descripcion_producto ?? null,
              cantidad: d.cantidad,
              unidad: d.unidad,
              precio_unitario: d.precio_unitario,
              subtotal: d.subtotal,
              tipo,
            };
          }
        );
        setDetalle({
          codigo: fila.codigo,
          cliente: fila.clientes,
          tipoObra: fila.tipo_obra,
          kit: fila.kits?.nombre ?? null,
          area: fila.area ?? null,
          presupuesto: fila.presupuesto ?? null,
          fecha: obtenerFecha(fila.fecha_emision),
          descripcionObra: fila.descripcion_obra,
          estado: fila.estado,
          observaciones: fila.observaciones,
          total: fila.total,
          items,
        });
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo cargar la cotización.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [codigo]);

  const cambiarEstado = async (nuevo: EstadoCotizacion) => {
    if (!detalle || actualizando) return;
    setActualizando(true);
    setErrorEstado("");
    const { error } = await getSupabase()
      .from("cotizaciones")
      .update({ estado: nuevo })
      .eq("codigo", detalle.codigo);
    if (error) {
      setErrorEstado(error.message);
      setActualizando(false);
      return;
    }
    setDetalle((actual) => (actual ? { ...actual, estado: nuevo } : actual));
    setActualizando(false);
  };

  if (cargando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando cotización...
        </p>
      </div>
    );
  }

  if (noEncontrada || !detalle) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cotización no encontrada
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          No existe una cotización con el código &quot;{codigo}&quot;.
        </p>
        <Link
          href="/dashboard/cotizaciones"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
        >
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          No se pudo cargar la cotización
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          {errorCarga}
        </p>
        <Link
          href="/dashboard/cotizaciones"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
        >
          Volver a cotizaciones
        </Link>
      </div>
    );
  }

  const materiales = detalle.items.filter((i) => i.tipo === "material");
  const herramientas = detalle.items.filter((i) => i.tipo === "herramienta");
  const maquinaria = detalle.items.filter((i) => i.tipo === "maquinaria");

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/dashboard/cotizaciones"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-500"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Volver a cotizaciones
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Cotización
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              {detalle.codigo}
            </h1>
          </div>
          {errorEstado && (
            <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
              No se pudo cambiar el estado: {errorEstado}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {detalle.estado === "aceptada" && (
              <button
                type="button"
                title="La generación del pedido se implementará en una próxima etapa."
                className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Generar pedido
              </button>
            )}
            <label className="relative inline-block">
              <span className="sr-only">Cambiar estado</span>
              <select
                value={detalle.estado}
                onChange={(e) =>
                  void cambiarEstado(e.target.value as EstadoCotizacion)
                }
                disabled={actualizando}
                title="Cambiar estado"
                className={`cursor-pointer appearance-none rounded-full px-4 py-1.5 pr-8 text-xs font-semibold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  estadoClases[detalle.estado] ??
                  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {estados.map((estadoActual) => (
                  <option key={estadoActual} value={estadoActual}>
                    {estadoLabels[estadoActual] ?? "Desconocido"}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-current opacity-70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </label>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Datos de la cotización
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Código</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.codigo}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Fecha</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.fecha}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Estado</dt>
                <dd className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      estadoClases[detalle.estado]
                    }`}
                  >
                    {estadoLabels[detalle.estado] ?? "Desconocido"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Cliente
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Nombres y apellidos
                </dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.cliente?.nombre ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Teléfono</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.cliente?.telefono ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.cliente?.email ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Dirección</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.cliente?.direccion ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
            Datos de KitObra IA
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Tipo de obra</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {detalle.tipoObra}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Área</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {detalle.area !== null
                  ? `${formatCantidad.format(detalle.area)} m²`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">
                Presupuesto indicado
              </dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {detalle.presupuesto !== null
                  ? formatPrecio.format(detalle.presupuesto)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Kit</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {detalle.kit ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-zinc-500 dark:text-zinc-400">
                Descripción / recomendación IA
              </dt>
              <dd className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {detalle.descripcionObra ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Productos
            </h2>
          </div>
          {materiales.length >= 0 && (
            <TablaDetalleItem
              items={materiales}
              vacio="No hay productos registrados para esta cotización."
            />
          )}
          <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Total estimado
            </p>
            <p className="ml-8 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatPrecio00.format(detalle.total)}
            </p>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Herramientas seleccionadas
            </h2>
            <TablaDetalleItem
              items={herramientas}
              vacio="Sin herramientas seleccionadas."
            />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Maquinaria seleccionada
            </h2>
            <TablaDetalleItem
              items={maquinaria}
              vacio="Sin maquinaria seleccionada."
            />
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
            Observaciones
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {detalle.observaciones ?? "Sin observaciones."}
          </p>
        </section>
      </div>
    </div>
  );
}