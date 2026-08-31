"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

interface TopItem {
  nombre: string;
  total: number;
}

interface ProductoStock {
  id: string;
  nombre: string;
  stock: number;
  unidad: string;
  estado: string;
}

interface CotizacionReciente {
  id: string;
  cliente: string;
  tipo: string;
  fecha: string;
  monto: number;
  estado: string;
}

interface DatosDashboard {
  totalProductos: number;
  totalBajoStock: number;
  totalClientes: number;
  totalCotizaciones: number;
  aceptadas: number;
  rechazadas: number;
  totalPedidos: number;
  pedidosPendientes: number;
  totalAlquileres: number;
  topKits: TopItem[];
  topProductos: TopItem[];
  cotizacionesRecientes: CotizacionReciente[];
  productosBajoStock: ProductoStock[];
}

interface FilaDetalle {
  producto_id: string | null;
  cantidad: number;
  productos: { nombre: string } | null;
}

interface FilaKit {
  kit_id: string | null;
  kits: { nombre: string } | null;
}

interface FilaReciente {
  codigo: string;
  tipo_obra: string;
  total: number;
  estado: string;
  created_at: string;
  clientes: { nombre: string } | null;
}

const mesesCortos = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const fechaRelativa = (iso: string): string => {
  const fecha = new Date(iso);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioFecha = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate()
  );
  const dias = Math.round(
    (inicioHoy.getTime() - inicioFecha.getTime()) / 86400000
  );
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  return `${fecha.getDate()} ${mesesCortos[fecha.getMonth()]}`;
};

const contarCotizaciones = async (
  desde: string,
  hasta: string,
  estado?: string
): Promise<number> => {
  const supabase = getSupabase();
  let q = supabase
    .from("cotizaciones")
    .select("id", { count: "exact", head: true });
  if (estado) q = q.eq("estado", estado);
  if (desde) q = q.gte("created_at", `${desde}T00:00:00`);
  if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`);
  const { count } = await q;
  return count ?? 0;
};

const contarPedidos = async (
  desde: string,
  hasta: string,
  estado?: string
): Promise<number> => {
  const supabase = getSupabase();
  let q = supabase.from("pedidos").select("id", { count: "exact", head: true });
  if (estado) q = q.eq("estado", estado);
  if (desde) q = q.gte("created_at", `${desde}T00:00:00`);
  if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`);
  const { count } = await q;
  return count ?? 0;
};

const contarAlquileres = async (
  desde: string,
  hasta: string
): Promise<number> => {
  const supabase = getSupabase();
  let q = supabase
    .from("alquileres")
    .select("id", { count: "exact", head: true });
  if (desde) q = q.gte("created_at", `${desde}T00:00:00`);
  if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`);
  const { count } = await q;
  return count ?? 0;
};

const cargarDatos = async (desde: string, hasta: string): Promise<DatosDashboard> => {
  const supabase = getSupabase();

  const [totalProductos, totalClientes] = await Promise.all([
    supabase
      .from("productos")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true }),
  ]);

  const [
    productos,
    kitsCotizados,
    detalleCotizaciones,
    detallePedidos,
    recientes,
  ] = await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, stock, unidad, estado")
        .order("nombre", { ascending: true }),
      (() => {
        let q = supabase
          .from("cotizaciones")
          .select("kit_id, kits(nombre)")
          .not("kit_id", "is", null);
        if (desde) q = q.gte("created_at", `${desde}T00:00:00`);
        if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`);
        return q;
      })(),
      (() => {
        let q = supabase
          .from("cotizacion_detalles")
          .select(
            "producto_id, cantidad, productos(nombre), cotizaciones!inner(created_at)"
          );
        if (desde) q = q.gte("cotizaciones.created_at", `${desde}T00:00:00`);
        if (hasta) q = q.lte("cotizaciones.created_at", `${hasta}T23:59:59`);
        return q;
      })(),
      (() => {
        let q = supabase
          .from("pedido_detalles")
          .select(
            "producto_id, cantidad, productos(nombre), pedidos!inner(created_at)"
          );
        if (desde) q = q.gte("pedidos.created_at", `${desde}T00:00:00`);
        if (hasta) q = q.lte("pedidos.created_at", `${hasta}T23:59:59`);
        return q;
      })(),
      (() => {
        let q = supabase
          .from("cotizaciones")
          .select(
            "codigo, tipo_obra, total, estado, created_at, clientes(nombre)"
          )
          .order("created_at", { ascending: false })
          .limit(7);
        if (desde) q = q.gte("created_at", `${desde}T00:00:00`);
        if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`);
        return q;
      })(),
    ]);

  const [
    totalCotizaciones,
    aceptadas,
    rechazadas,
    totalPedidos,
    pedidosPendientes,
    totalAlquileres,
  ] = await Promise.all([
    contarCotizaciones(desde, hasta),
    contarCotizaciones(desde, hasta, "aceptada"),
    contarCotizaciones(desde, hasta, "rechazada"),
    contarPedidos(desde, hasta),
    contarPedidos(desde, hasta, "pendiente"),
    contarAlquileres(desde, hasta),
  ]);

  const cantidadesPorProducto = new Map<string, TopItem>();
  const acumularProductos = (filas: FilaDetalle[]) => {
    for (const fila of filas) {
      if (!fila.producto_id || !fila.productos?.nombre) continue;
      const previo = cantidadesPorProducto.get(fila.producto_id)?.total ?? 0;
      cantidadesPorProducto.set(fila.producto_id, {
        nombre: fila.productos.nombre,
        total: previo + Number(fila.cantidad),
      });
    }
  };
  acumularProductos(
    (detalleCotizaciones.data ?? []) as unknown as FilaDetalle[]
  );
  acumularProductos((detallePedidos.data ?? []) as unknown as FilaDetalle[]);

  const topProductos = [...cantidadesPorProducto.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const solicitudesPorKit = new Map<string, TopItem>();
  for (const fila of (kitsCotizados.data ?? []) as unknown as FilaKit[]) {
    if (!fila.kit_id || !fila.kits?.nombre) continue;
    const previo = solicitudesPorKit.get(fila.kit_id)?.total ?? 0;
    solicitudesPorKit.set(fila.kit_id, {
      nombre: fila.kits.nombre,
      total: previo + 1,
    });
  }

  const topKits = [...solicitudesPorKit.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const filasProductos = (productos.data ?? []) as unknown as ProductoStock[];
  const productosBajoStock = filasProductos
    .filter(
      (p) => p.stock > 0 && (p.estado === "bajo stock" || p.stock <= 10)
    )
    .slice(0, 8);

  const cotizacionesRecientes = (
    (recientes.data ?? []) as unknown as FilaReciente[]
  ).map((fila) => ({
    id: fila.codigo,
    cliente: fila.clientes?.nombre ?? "—",
    tipo: fila.tipo_obra,
    fecha: fechaRelativa(fila.created_at),
    monto: Number(fila.total),
    estado: fila.estado,
  }));

  return {
    totalProductos: totalProductos.count ?? 0,
    totalBajoStock: productosBajoStock.length,
    totalClientes: totalClientes.count ?? 0,
    totalCotizaciones,
    aceptadas,
    rechazadas,
    totalPedidos,
    pedidosPendientes,
    totalAlquileres,
    topKits,
    topProductos,
    cotizacionesRecientes,
    productosBajoStock,
  };
};

const estadoInfo: Record<string, { label: string; classes: string }> = {
  nueva: {
    label: "Nueva",
    classes:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  en_revision: {
    label: "En revisión",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  cotizada: {
    label: "Cotizada",
    classes:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  aceptada: {
    label: "Aceptada",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  rechazada: {
    label: "Rechazada",
    classes:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};
const estadoNeutro =
  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";

export default function DashboardPage() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [rango, setRango] = useState({ desde: "", hasta: "" });
  const [errorRango, setErrorRango] = useState("");
  const [data, setData] = useState<DatosDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.resolve(cargarDatos(rango.desde, rango.hasta))
      .then((resumen) => {
        if (activo) setData(resumen);
      })
      .catch((err: unknown) => {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los datos."
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [rango.desde, rango.hasta]);

  const aplicarRango = () => {
    if (desde && hasta && desde > hasta) {
      setErrorRango(
        "La fecha 'desde' no puede ser mayor que la fecha 'hasta'."
      );
      return;
    }
    setErrorRango("");
    setCargando(true);
    setRango({ desde, hasta });
  };

  const limpiarRango = () => {
    setDesde("");
    setHasta("");
    setErrorRango("");
    setCargando(true);
    setRango({ desde: "", hasta: "" });
  };

  const tieneRango = Boolean(rango.desde || rango.hasta);

  const valorMetrica = (valor: number): string =>
    cargando && !data ? "—" : String(valor);

  const kpis = [
    {
      label: "Total de productos",
      valor: valorMetrica(data?.totalProductos ?? 0),
      detalle: "en catálogo",
    },
    {
      label: "Productos con bajo stock",
      valor: valorMetrica(data?.totalBajoStock ?? 0),
      detalle: "requieren reposición",
    },
    {
      label: "Total de clientes",
      valor: valorMetrica(data?.totalClientes ?? 0),
      detalle: "registrados",
    },
    {
      label: "Total de cotizaciones",
      valor: valorMetrica(data?.totalCotizaciones ?? 0),
      detalle: tieneRango ? "en el rango de fechas" : "históricas",
    },
    {
      label: "Cotizaciones aceptadas",
      valor: valorMetrica(data?.aceptadas ?? 0),
      detalle: tieneRango ? "en el rango de fechas" : "históricas",
    },
    {
      label: "Cotizaciones rechazadas",
      valor: valorMetrica(data?.rechazadas ?? 0),
      detalle: tieneRango ? "en el rango de fechas" : "históricas",
    },
    {
      label: "Total de pedidos",
      valor: valorMetrica(data?.totalPedidos ?? 0),
      detalle: tieneRango ? "en el rango de fechas" : "históricos",
    },
    {
      label: "Pedidos pendientes",
      valor: valorMetrica(data?.pedidosPendientes ?? 0),
      detalle: tieneRango ? "en el rango de fechas" : "históricos",
    },
    {
      label: "Total de alquileres",
      valor: valorMetrica(data?.totalAlquileres ?? 0),
      detalle: tieneRango ? "en el rango de fechas" : "históricos",
    },
  ];

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Resumen general de la actividad de WONG ObraSmart.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudieron cargar los datos.</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end gap-4">
            <label className="block w-full sm:w-auto">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Fecha desde
              </span>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 sm:w-44 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="block w-full sm:w-auto">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Fecha hasta
              </span>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 sm:w-44 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <button
              type="button"
              onClick={aplicarRango}
              disabled={cargando}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={limpiarRango}
              disabled={cargando}
              className="rounded-xl border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Limpiar
            </button>
            {cargando && (
              <p className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
                Cargando datos...
              </p>
            )}
          </div>
          {errorRango && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {errorRango}
            </p>
          )}
          {!errorRango && tieneRango && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Mostrando del{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {rango.desde || "inicio"}
              </span>{" "}
              al{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {rango.hasta || "hoy"}
              </span>
              .
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {stat.valor}
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {stat.detalle}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Cotizaciones recientes
              </h2>
            </div>
            {cargando && !data ? (
              <p className="px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Cargando...
              </p>
            ) : !data || data.cotizacionesRecientes.length === 0 ? (
              <p className="px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                Sin cotizaciones en el período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                      <th className="sticky left-0 z-10 bg-zinc-50 px-6 py-3 font-medium dark:bg-zinc-950">
                        N°
                      </th>
                      <th className="px-6 py-3 font-medium">Cliente</th>
                      <th className="px-6 py-3 font-medium">Tipo de obra</th>
                      <th className="px-6 py-3 font-medium">Fecha</th>
                      <th className="px-6 py-3 font-medium">Monto</th>
                      <th className="px-6 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cotizacionesRecientes.map((cot) => (
                      <tr
                        key={cot.id}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                      >
                        <td className="sticky left-0 bg-white px-6 py-3 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          {cot.id}
                        </td>
                        <td className="px-6 py-3 text-zinc-700 dark:text-zinc-300">
                          {cot.cliente}
                        </td>
                        <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                          {cot.tipo}
                        </td>
                        <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                          {cot.fecha}
                        </td>
                        <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                          {formatPrecio.format(cot.monto)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              estadoInfo[cot.estado]?.classes ?? estadoNeutro
                            }`}
                          >
                            {estadoInfo[cot.estado]?.label ?? "Desconocido"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Kits más solicitados
              </h2>
              {!data || data.topKits.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin datos aún.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.topKits.map((kit, index) => (
                    <li
                      key={kit.nombre}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                        {kit.nombre}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {kit.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Productos más solicitados
              </h2>
              {!data || data.topProductos.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin datos aún.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.topProductos.map((producto, index) => (
                    <li
                      key={producto.nombre}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                        {producto.nombre}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {producto.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Productos con bajo stock
              </h2>
              {!data || data.productosBajoStock.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin datos aún.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.productosBajoStock.map((producto) => (
                    <li
                      key={producto.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        {producto.nombre}
                      </span>
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        {producto.stock} {producto.unidad}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}