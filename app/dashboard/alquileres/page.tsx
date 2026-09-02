"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type EstadoAlquiler =
  | "solicitado"
  | "reservado"
  | "entregado"
  | "devuelto"
  | "cancelado";

const estados: EstadoAlquiler[] = [
  "solicitado",
  "reservado",
  "entregado",
  "devuelto",
  "cancelado",
];

interface Alquiler {
  id: string;
  codigo: string;
  cliente: string;
  maquinaria: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  precioDia: number;
  total: number;
  estado: EstadoAlquiler;
}

interface FilaAlquiler {
  id: string;
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  precio_dia: number;
  total: number;
  estado: EstadoAlquiler;
  clientes: { nombre: string } | null;
  maquinarias: { nombre: string } | null;
}

const estadoInfo: Record<EstadoAlquiler, { label: string; classes: string }> = {
  solicitado: {
    label: "Solicitado",
    classes:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  reservado: {
    label: "Reservado",
    classes:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  entregado: {
    label: "Entregado",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  devuelto: {
    label: "Devuelto",
    classes:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
  },
  cancelado: {
    label: "Cancelado",
    classes:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const obtenerFecha = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fetchAlquileres = () =>
  getSupabase()
    .from("alquileres")
    .select(
      "id, codigo, fecha_inicio, fecha_fin, dias, precio_dia, total, estado, clientes(nombre), maquinarias(nombre)"
    )
    .order("fecha_inicio", { ascending: false });

const convertirFila = (fila: FilaAlquiler): Alquiler => ({
  id: fila.id,
  codigo: fila.codigo,
  cliente: fila.clientes?.nombre ?? "—",
  maquinaria: fila.maquinarias?.nombre ?? "—",
  fechaInicio: obtenerFecha(fila.fecha_inicio),
  fechaFin: obtenerFecha(fila.fecha_fin),
  dias: fila.dias,
  precioDia: fila.precio_dia,
  total: fila.total,
  estado: fila.estado,
});

export default function AlquileresPage() {
  const [items, setItems] = useState<Alquiler[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState("");
  const [estado, setEstado] = useState<EstadoAlquiler | "todos">("todos");

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchAlquileres())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          setItems(
            ((data ?? []) as unknown as FilaAlquiler[]).map(convertirFila)
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
    if (estado === "todos") return items;
    return items.filter((alquiler) => alquiler.estado === estado);
  }, [items, estado]);

  const cambiarEstado = async (id: string, nuevo: EstadoAlquiler) => {
    if (actualizandoId) return;
    setActualizandoId(id);
    setErrorSupabase("");
    setConfirmacion("");
    const { error } = await getSupabase()
      .from("alquileres")
      .update({ estado: nuevo })
      .eq("id", id);
    if (error) {
      setErrorSupabase(error.message);
      setActualizandoId(null);
      return;
    }
    setItems((actual) =>
      actual.map((item) =>
        item.id === id ? { ...item, estado: nuevo } : item
      )
    );
    setActualizandoId(null);
    setConfirmacion(
      `Estado actualizado a "${estadoInfo[nuevo]?.label ?? nuevo}".`
    );
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Alquileres
            </h1>
            <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando alquileres..."
                : errorSupabase
                  ? "No se pudieron cargar los alquileres."
                  : `${filtradas.length} de ${items.length} alquileres registrados.`}
            </p>
          </div>
          <label className="w-full sm:w-52 lg:mr-0">
            <span className="sr-only">Filtrar por estado</span>
            <select
              value={estado}
              onChange={(e) =>
                setEstado(e.target.value as EstadoAlquiler | "todos")
              }
              className="h-12 w-full cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 outline-none transition-colors focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <option value="todos">Todos los estados</option>
              {estados.map((estadoActual) => (
                <option key={estadoActual} value={estadoActual}>
                  {estadoInfo[estadoActual]?.label ?? "Desconocido"}
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
                : "No se pudieron cargar los alquileres."}
            </p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {confirmacion && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <p className="font-medium">{confirmacion}</p>
            <button
              type="button"
              onClick={() => setConfirmacion("")}
              className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-emerald-100 dark:border-emerald-500/50 dark:hover:bg-emerald-500/10"
            >
              Cerrar
            </button>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando alquileres...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay alquileres registrados.
          </div>
        ) : filtradas.length === 0 ? (
          <>
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No hay alquileres con el estado seleccionado.
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Mostrando {filtradas.length} de {items.length} alquileres.
            </p>
          </>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Código
                    </th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Maquinaria</th>
                    <th className="px-5 py-3 font-medium">Fecha inicio</th>
                    <th className="px-5 py-3 font-medium">Fecha fin</th>
                    <th className="px-5 py-3 font-medium">Días</th>
                    <th className="px-5 py-3 font-medium">Precio/día</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((alquiler) => {
                    const estado = estadoInfo[alquiler.estado] ?? {
                      label: "Desconocido",
                      classes:
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                    };
                    return (
                      <tr
                        key={alquiler.id}
                        className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                      >
                        <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                          {alquiler.codigo}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                          {alquiler.cliente}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {alquiler.maquinaria}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {alquiler.fechaInicio}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {alquiler.fechaFin}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                          {alquiler.dias}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {formatPrecio.format(alquiler.precioDia)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                          {formatPrecio.format(alquiler.total)}
                        </td>
                        <td className="px-5 py-3.5">
                          <label className="relative inline-block">
                            <span className="sr-only">Cambiar estado</span>
                            <select
                              value={alquiler.estado}
                              onChange={(e) =>
                                void cambiarEstado(
                                  alquiler.id,
                                  e.target.value as EstadoAlquiler
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
                              href={`/dashboard/alquileres/${alquiler.codigo}`}
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
      </div>
    </div>
  );
}