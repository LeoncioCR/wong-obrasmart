"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import KitObraRecomendador from "@/components/KitObraRecomendador";

interface KitCard {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_obra: string;
  precio_referencial: number;
}

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fetchKits = () =>
  getSupabase()
    .from("kits")
    .select("id, nombre, descripcion, tipo_obra, precio_referencial")
    .order("nombre", { ascending: true });

export default function KitsPage() {
  const [items, setItems] = useState<KitCard[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchKits())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
        } else {
          setItems((data ?? []) as unknown as KitCard[]);
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
    <div className="flex flex-1 flex-col px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-500">WONG · Kits</p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Kits
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Paquetes prearmados con los materiales justos para cada tipo de
          micro-obra.
        </p>

        <KitObraRecomendador />

        {errorSupabase ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudieron cargar los kits.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        ) : cargando ? (
          <p className="mt-16 text-center text-zinc-500 dark:text-zinc-400">
            Cargando kits...
          </p>
        ) : items.length === 0 ? (
          <p className="mt-16 text-center text-zinc-500 dark:text-zinc-400">
            No hay kits disponibles.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((kit) => (
              <article
                key={kit.id}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-red-600/50 hover:shadow-lg hover:shadow-red-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-red-500/30"
              >
                <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {kit.tipo_obra}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {kit.nombre}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {kit.descripcion}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Precio referencial
                    </p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {formatPrecio.format(kit.precio_referencial)}
                    </p>
                  </div>
                  <Link
                    href={`/kits/${kit.id}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 text-sm font-semibold text-white shadow-md shadow-red-600/30 transition-all hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/40"
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}