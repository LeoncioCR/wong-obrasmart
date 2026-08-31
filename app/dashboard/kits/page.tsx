"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

interface KitListado {
  id: string;
  nombre: string;
  tipo_obra: string;
  cantidadProductos: number;
  estado: "activo" | "inactivo";
}

interface FilaKit {
  id: string;
  nombre: string;
  tipo_obra: string;
  estado: "activo" | "inactivo";
  kit_productos: { count: number }[];
}

const estadoBadge = {
  activo: {
    label: "Activo",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  inactivo: {
    label: "Inactivo",
    classes:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
} as const;

const fetchKits = () =>
  getSupabase()
    .from("kits")
    .select("id, nombre, tipo_obra, estado, kit_productos(count)")
    .order("nombre", { ascending: true });

export default function KitsAdminPage() {
  const [items, setItems] = useState<KitListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchKits())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          const filas = (data ?? []) as unknown as FilaKit[];
          setItems(
            filas.map((kit) => ({
              id: kit.id,
              nombre: kit.nombre,
              tipo_obra: kit.tipo_obra,
              estado: kit.estado,
              cantidadProductos: kit.kit_productos?.[0]?.count ?? 0,
            }))
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

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Kits
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando kits..."
                : errorSupabase
                  ? "No se pudieron cargar los kits."
                  : `${items.length} kits de obra configurados.`}
            </p>
          </div>

          <Link
            href="/dashboard/kits/nuevo"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700"
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
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Nuevo kit
          </Link>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudieron cargar los kits.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando kits...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay kits registrados.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Nombre
                    </th>
                    <th className="px-5 py-3 font-medium">Tipo de obra</th>
                    <th className="px-5 py-3 font-medium">
                      Cantidad de productos
                    </th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((kit) => {
                    const badge = estadoBadge[kit.estado] ?? {
                      label: "Desconocido",
                      classes:
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                    };
                    return (
                      <tr
                        key={kit.id}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                      >
                        <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                          {kit.nombre}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {kit.tipo_obra}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                          {kit.cantidadProductos} productos
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
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