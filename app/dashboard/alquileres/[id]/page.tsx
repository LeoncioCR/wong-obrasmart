"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
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

interface ClienteInfo {
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
}

interface MaquinaInfo {
  id: string;
  nombre: string;
  descripcion: string | null;
  disponible: boolean;
}

interface AlquilerDetalle {
  id: string;
  codigo: string;
  cliente: ClienteInfo | null;
  maquinaria: MaquinaInfo | null;
  fechaInicioRaw: string;
  fechaFinRaw: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  precioDia: number;
  total: number;
  estado: EstadoAlquiler;
  observaciones: string | null;
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
  observaciones: string | null;
  clientes: ClienteInfo | null;
  maquinarias: MaquinaInfo | null;
}

interface Disponibilidad {
  disponible: boolean | null;
  ocupaciones: number;
}

const estadoClases: Record<EstadoAlquiler, string> = {
  solicitado:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  reservado:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  entregado:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  devuelto:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const estadoLabels: Record<EstadoAlquiler, string> = {
  solicitado: "Solicitado",
  reservado: "Reservado",
  entregado: "Entregado",
  devuelto: "Devuelto",
  cancelado: "Cancelado",
};

const formatPrecio = new Intl.NumberFormat("es-PE", {
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

const fetchAlquiler = (codigo: string) =>
  getSupabase()
    .from("alquileres")
    .select(
      "id, codigo, fecha_inicio, fecha_fin, dias, precio_dia, total, estado, observaciones, clientes(nombre, telefono, email, direccion), maquinarias(id, nombre, descripcion, disponible)"
    )
    .eq("codigo", codigo)
    .maybeSingle();

export default function AlquilerDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Cargando alquiler...
          </p>
        </div>
      }
    >
      <AlquilerDetalle params={params} />
    </Suspense>
  );
}

function AlquilerDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DetalleContenido codigo={id} />;
}

function DetalleContenido({ codigo }: { codigo: string }) {
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [detalle, setDetalle] = useState<AlquilerDetalle | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>({
    disponible: null,
    ocupaciones: 0,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchAlquiler(codigo))
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorCarga(error.message);
          setCargando(false);
          return;
        }
        if (!data) {
          setNoEncontrado(true);
          setCargando(false);
          return;
        }
        const fila = data as unknown as FilaAlquiler;
        setDetalle({
          id: fila.id,
          codigo: fila.codigo,
          cliente: fila.clientes,
          maquinaria: fila.maquinarias,
          fechaInicioRaw: fila.fecha_inicio,
          fechaFinRaw: fila.fecha_fin,
          fechaInicio: obtenerFecha(fila.fecha_inicio),
          fechaFin: obtenerFecha(fila.fecha_fin),
          dias: fila.dias,
          precioDia: fila.precio_dia,
          total: fila.total,
          estado: fila.estado,
          observaciones: fila.observaciones,
        });
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo cargar el alquiler.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [codigo]);

  useEffect(() => {
    if (!detalle?.maquinaria) return;
    if (detalle.estado !== "reservado" && detalle.estado !== "entregado")
      return;
    let activo = true;
    const { maquinaria } = detalle;
    Promise.resolve(
      getSupabase()
        .from("alquileres")
        .select("id", { count: "exact", head: true })
        .eq("maquinaria_id", maquinaria.id)
        .neq("id", detalle.id)
        .in("estado", ["solicitado", "reservado", "entregado"])
        .lte("fecha_inicio", detalle.fechaFinRaw)
        .gte("fecha_fin", detalle.fechaInicioRaw)
    )
      .then(({ count, error }) => {
        if (!activo) return;
        if (error) {
          setDisponibilidad({ disponible: null, ocupaciones: 0 });
          return;
        }
        setDisponibilidad({
          disponible: maquinaria.disponible && (count ?? 0) === 0,
          ocupaciones: count ?? 0,
        });
      })
      .catch(() => {
        if (activo) {
          setDisponibilidad({ disponible: null, ocupaciones: 0 });
        }
      });
    return () => {
      activo = false;
    };
  }, [detalle]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cambiarEstado = async (nuevo: EstadoAlquiler) => {
    if (!detalle || nuevo === detalle.estado || actualizando) return;
    setActualizando(true);
    setErrorEstado("");
    setConfirmacion("");
    const { error } = await getSupabase()
      .from("alquileres")
      .update({ estado: nuevo })
      .eq("id", detalle.id);
    if (error) {
      setErrorEstado(error.message);
      setActualizando(false);
      return;
    }
    setDetalle({ ...detalle, estado: nuevo });
    setActualizando(false);
    setConfirmacion(`Estado actualizado a "${estadoLabels[nuevo]}".`);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setConfirmacion(""), 5000);
  };

  if (cargando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando alquiler...
        </p>
      </div>
    );
  }

  if (noEncontrado || !detalle) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Alquiler no encontrado
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          No existe un alquiler con el código &quot;{codigo}&quot;.
        </p>
        <Link
          href="/dashboard/alquileres"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Volver a alquileres
        </Link>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          No se pudo cargar el alquiler
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {errorCarga}
        </p>
        <Link
          href="/dashboard/alquileres"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Volver a alquileres
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/dashboard/alquileres"
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
          Volver a alquileres
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Alquiler
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              {detalle.codigo}
            </h1>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                estadoClases[detalle.estado] ??
                "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {estadoLabels[detalle.estado] ?? "Desconocido"}
            </span>
            <label>
              <span className="sr-only">Cambiar estado</span>
              <select
                value={detalle.estado}
                onChange={(e) =>
                  void cambiarEstado(e.target.value as EstadoAlquiler)
                }
                disabled={actualizando}
                className="h-10 w-44 cursor-pointer rounded-full border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 outline-none transition-colors focus:border-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estadoLabels[estado]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

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

        {errorEstado && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo cambiar el estado.</p>
            <p className="mt-1">{errorEstado}</p>
          </div>
        )}

        {detalle.estado === "reservado" || detalle.estado === "entregado" ? (
          <section className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                Disponibilidad de la maquinaria
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {detalle.maquinaria?.nombre ?? "—"} · {detalle.fechaInicio} al{" "}
                {detalle.fechaFin}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {disponibilidad.disponible === null ? (
                <span className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Comprobando...
                </span>
              ) : disponibilidad.disponible ? (
                <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Disponible
                </span>
              ) : (
                <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Ocupada
                </span>
              )}
              {disponibilidad.disponible === null ? (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Verificando otros alquileres en esas fechas...
                </span>
              ) : disponibilidad.disponible ? (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sin conflictos en esas fechas.
                </span>
              ) : (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {disponibilidad.ocupaciones} alquiler(es) activo(s) en esas
                  fechas.
                </span>
              )}
            </div>
          </section>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Cliente
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Nombre</dt>
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

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Información del alquiler
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Fecha de inicio
                </dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.fechaInicio}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Fecha de fin</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.fechaFin}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Días</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.dias}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Estado</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {estadoLabels[detalle.estado]}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Observaciones
                </dt>
                <dd className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {detalle.observaciones ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Maquinaria
            </h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {detalle.maquinaria?.nombre ?? "—"}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {detalle.maquinaria?.descripcion ?? "Sin descripción."}
            </p>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Resumen
            </h2>
          </div>
          <dl className="space-y-2 px-6 py-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Precio por día</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {formatPrecio.format(detalle.precioDia)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">
                Días ({detalle.fechaInicio} al {detalle.fechaFin})
              </dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {detalle.dias}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">Total</dt>
              <dd className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrecio.format(detalle.total)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}