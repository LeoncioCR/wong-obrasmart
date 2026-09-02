"use client";

import { useEffect, useMemo, useState } from "react";
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

interface Cotizacion {
  id: string;
  codigo: string;
  cliente: string;
  tipoObra: string;
  area: number | null;
  kit: string;
  fecha: string;
  total: number;
  estado: EstadoCotizacion;
}

interface FilaCotizacion {
  id: string;
  codigo: string;
  tipo_obra: string;
  area: number | null;
  fecha_emision: string;
  total: number;
  estado: EstadoCotizacion;
  clientes: { nombre: string } | null;
  kits: { nombre: string } | null;
}

const estadoInfo: Record<EstadoCotizacion, { label: string; classes: string }> = {
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

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const formatCantidad = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

const obtenerFecha = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fetchCotizaciones = () =>
  getSupabase()
    .from("cotizaciones")
    .select(
      "id, codigo, tipo_obra, area, fecha_emision, total, estado, clientes(nombre), kits(nombre)"
    )
    .order("fecha_emision", { ascending: false });

const convertirFila = (fila: FilaCotizacion): Cotizacion => ({
  id: fila.id,
  codigo: fila.codigo,
  cliente: fila.clientes?.nombre ?? "—",
  tipoObra: fila.tipo_obra,
  area: fila.area ?? null,
  kit: fila.kits?.nombre ?? "—",
  fecha: obtenerFecha(fila.fecha_emision),
  total: fila.total,
  estado: fila.estado,
});

export default function CotizacionesPage() {
  const [items, setItems] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [estado, setEstado] = useState<EstadoCotizacion | "todas">("todas");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchCotizaciones())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          setItems(
            ((data ?? []) as unknown as FilaCotizacion[]).map(convertirFila)
          );
        }
        setCargando(false);
      })
      .catch(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    if (estado === "todas") return items;
    return items.filter((cot) => cot.estado === estado);
  }, [items, estado]);

  const cambiarEstado = async (id: string, nuevo: EstadoCotizacion) => {
    if (actualizandoId) return;
    setActualizandoId(id);
    setErrorSupabase("");
    const { error } = await getSupabase()
      .from("cotizaciones")
      .update({ estado: nuevo })
      .eq("id", id);
    if (error) {
      setErrorSupabase(error.message);
      setActualizandoId(null);
      return;
    }
    setItems((actual) =>
      actual.map((cot) =>
        cot.id === id ? { ...cot, estado: nuevo } : cot
      )
    );
    setActualizandoId(null);
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Cotizaciones
            </h1>
            <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando cotizaciones..."
                : errorSupabase
                  ? "No se pudieron cargar las cotizaciones."
                  : `${filtradas.length} de ${items.length} cotizaciones.`}
            </p>
          </div>

          <label className="lg:w-72">
            <span className="sr-only">Filtrar por estado</span>
            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as EstadoCotizacion | "todas")
              }
              className="h-12 w-full rounded-full border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              <option value="todas">Todos los estados</option>
              {(Object.keys(estadoInfo) as EstadoCotizacion[]).map((estado) => (
                <option key={estado} value={estado}>
                  {estadoInfo[estado]?.label ?? "Desconocido"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">
              {actualizandoId
                ? "No se pudo cambiar el estado."
                : "No se pudieron cargar las cotizaciones."}
            </p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:text-zinc-400">
            Cargando cotizaciones...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:text-zinc-400">
            No hay cotizaciones registradas.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Código
                    </th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Tipo de obra</th>
                    <th className="px-5 py-3 font-medium">Área</th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((cot) => {
                    const estado = estadoInfo[cot.estado] ?? {
                      label: "Desconocido",
                      classes:
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                    };
                    return (
                      <tr
                        key={cot.id}
                        className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 last:border-0 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                      >
                        <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                          {cot.codigo}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                          {cot.cliente}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {cot.tipoObra}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {cot.area !== null
                            ? `${formatCantidad.format(cot.area)} m²`
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {cot.fecha}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                          {formatPrecio.format(cot.total)}
                        </td>
                        <td className="px-5 py-3.5">
                          <label className="relative inline-block">
                            <span className="sr-only">Cambiar estado</span>
                            <select
                              value={cot.estado}
                              onChange={(e) =>
                                void cambiarEstado(
                                  cot.id,
                                  e.target.value as EstadoCotizacion
                                )
                              }
                              disabled={actualizandoId !== null}
                              title="Cambiar estado"
                              className={`cursor-pointer appearance-none rounded-full px-3 py-1 pr-7 text-xs font-semibold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${estado.classes}`}
                            >
                              {estados.map((estadoActual) => (
                                <option
                                  key={estadoActual}
                                  value={estadoActual}
                                >
                                  {estadoInfo[estadoActual]?.label ??
                                    "Desconocido"}
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
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <Link
                              href={`/dashboard/cotizaciones/${cot.codigo}`}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!cargando && !errorSupabase && filtradas.length === 0 && (
          <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
            No hay cotizaciones con el estado seleccionado.
          </p>
        )}
      </div>
    </div>
  );
}