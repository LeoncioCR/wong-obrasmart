"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";

type EstadoCotizacion =
  | "nueva"
  | "en_revision"
  | "cotizada"
  | "aceptada"
  | "rechazada";

export interface NotificacionCotizacion {
  id: string;
  codigo: string;
  tipoObra: string;
  fecha: string;
  estado: EstadoCotizacion;
}

interface FilaInsert {
  id: string;
  codigo?: string;
  tipo_obra?: string;
  created_at?: string;
  estado?: EstadoCotizacion;
}

const estadoInfo: Record<EstadoCotizacion, { label: string; classes: string }> =
  {
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

const obtenerFecha = (createdAt?: string): string => {
  if (!createdAt) return "";
  const fecha = new Date(createdAt);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Convierte un timestamp ISO (o null) a un número comparable. Los valores
// inválidos/nulos se tratan como 0.
const createdAtComparable = (createdAt: string | null): number => {
  if (!createdAt) return 0;
  const t = new Date(createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export default function AdminNotifications() {
  const [notificaciones, setNotificaciones] = useState<NotificacionCotizacion[]>(
    [],
  );
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<NotificacionCotizacion | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idsVistos = useRef<Set<string>>(new Set());
  const baselineRef = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const noLeidas = notificaciones.length;

  const agregar = useCallback((nueva: NotificacionCotizacion) => {
    if (idsVistos.current.has(nueva.id)) return;
    idsVistos.current.add(nueva.id);
    setNotificaciones((prev) => [nueva, ...prev].slice(0, 20));
    setToast(nueva);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const cerrarAbierto = useCallback(() => setAbierto(false), []);

  useEffect(() => {
    const supabase = getSupabase();
    let activo = true;

    const cargarNuevaPorId = async (id: string) => {
      try {
        const { data, error } = await supabase
          .from("cotizaciones")
          .select("id, codigo, tipo_obra, created_at, estado")
          .eq("id", id)
          .maybeSingle();
        if (error || !data) return;
        agregar({
          id: data.id,
          codigo: data.codigo ?? "Sin código",
          tipoObra: data.tipo_obra ?? "Sin tipo",
          fecha: obtenerFecha(data.created_at),
          estado: data.estado ?? "nueva",
        });
      } catch {
        // Si no se puede enriquecer, se omite silenciosamente.
      }
    };

    // Línea base inicial: las cotizaciones ya existentes al montar no deben
    // disparar notificaciones.
    const fijarLineaBase = async () => {
      try {
        const { data, error } = await supabase
          .from("cotizaciones")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error || !data) return;
        baselineRef.current = data[0]?.created_at ?? null;
        data.forEach((f) => {
          if (f.id) idsVistos.current.add(f.id);
        });
      } catch {
        // Silencioso.
      }
    };

    const sonRecientes = (createdAt: string | null): boolean => {
      if (!createdAt) return true;
      const base = baselineRef.current;
      if (!base) return true;
      return createdAt > base;
    };

    // Cargar cotizaciones nuevas aparecidas desde la última revisión
    // (respaldo por si un evento Realtime no llega, p. ej. cotizaciones
    // creadas por el flujo público sin sesión).
    const revisarNuevas = async () => {
      try {
        const { data, error } = await supabase
          .from("cotizaciones")
          .select("id, codigo, tipo_obra, created_at, estado")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error || !data) return;
        let nuevoMaximo: string | null = baselineRef.current;
        const pendientes: string[] = [];
        for (const f of data) {
          if (!f.id) continue;
          if (createdAtComparable(f.created_at) > createdAtComparable(nuevoMaximo)) {
            nuevoMaximo = f.created_at ?? null;
          }
          if (!idsVistos.current.has(f.id) && sonRecientes(f.created_at)) {
            pendientes.push(f.id);
          }
        }
        if (activo && nuevoMaximo) baselineRef.current = nuevoMaximo;
        for (const id of pendientes) await cargarNuevaPorId(id);
      } catch {
        // Silencioso.
      }
    };

    void fijarLineaBase().then(() => {
      if (activo) {
        // Revisión inicial tras fijar la base, para no perder creaciones entre
        // la línea base y la suscripción.
        void revisarNuevas();
      }
    });

    const canal = supabase
      .channel("realtime-cotizaciones-insert")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cotizaciones" },
        (payload: RealtimePostgresChangesPayload<FilaInsert>) => {
          const fila = payload.new as FilaInsert;
          if (!fila?.id) return;
          // Con REPLICA IDENTITY por defecto, Realtime puede enviar solo el
          // primary key; por robustez se consulta la fila completa.
          void cargarNuevaPorId(fila.id);
        },
      )
      .subscribe();

    // Respaldo por si Realtime no está habilitado o no se entrega el evento
    // de una inserción hecha por el flujo público (anon).
    pollTimer.current = setInterval(() => {
      void revisarNuevas();
    }, 15000);

    const manejarClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        cerrarAbierto();
      }
    };
    document.addEventListener("mousedown", manejarClick);

    return () => {
      activo = false;
      document.removeEventListener("mousedown", manejarClick);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
      // Cerrar correctamente la suscripción Realtime al desmontar
      void supabase.removeChannel(canal);
    };
  }, [agregar, cerrarAbierto]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-label="Notificaciones"
          aria-expanded={abierto}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {noLeidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </button>

        {abierto && (
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Nuevas cotizaciones
              </p>
              {noLeidas > 0 ? (
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {noLeidas} sin revisar
                </p>
              ) : null}
            </div>

            {notificaciones.length === 0 ? (
              <p className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
                No hay cotizaciones nuevas.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {notificaciones.map((n) => (
                  <li key={n.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
                    <Link
                      href={`/dashboard/cotizaciones/${n.id}`}
                      onClick={cerrarAbierto}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          Cotización {n.codigo}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {n.tipoObra}
                        </p>
                        {n.fecha ? (
                          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                            {n.fecha}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          estadoInfo[n.estado]?.classes ??
                          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {estadoInfo[n.estado]?.label ?? "Nueva"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <Link
                href="/dashboard/cotizaciones"
                onClick={cerrarAbierto}
                className="block text-center text-xs font-medium text-red-600 hover:underline dark:text-red-500"
              >
                Ver todas las cotizaciones
              </Link>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-[60] w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">
            Nueva cotización
          </p>
          <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Cotización {toast.codigo}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {toast.tipoObra}
          </p>
          <Link
            href={`/dashboard/cotizaciones/${toast.id}`}
            onClick={() => setToast(null)}
            className="mt-2 inline-flex h-8 items-center justify-center rounded-full bg-red-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-red-700"
          >
            Ver cotización
          </Link>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Cerrar aviso"
            className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
