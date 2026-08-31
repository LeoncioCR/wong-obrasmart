"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

type Subcategoria =
  | "cemento"
  | "agregados"
  | "ladrillos"
  | "fierro"
  | "herramientas"
  | "pintura"
  | "tuberias";

interface ProductoCatalogo {
  id: string;
  nombre: string;
  subcategoria: Subcategoria | null;
  descripcion: string | null;
  precio: number;
  unidad: string;
  estado: "disponible" | "bajo stock" | "agotado";
  categoriaNombre: string;
}

interface FilaProducto {
  id: string;
  nombre: string;
  subcategoria: Subcategoria | null;
  descripcion: string | null;
  precio: number;
  unidad: string;
  estado: "disponible" | "bajo stock" | "agotado";
  categorias: { nombre: string } | null;
}

const subcategorias: { value: Subcategoria; label: string }[] = [
  { value: "cemento", label: "Cemento" },
  { value: "agregados", label: "Agregados" },
  { value: "ladrillos", label: "Ladrillos" },
  { value: "fierro", label: "Fierro" },
  { value: "herramientas", label: "Herramientas" },
  { value: "pintura", label: "Pintura" },
  { value: "tuberias", label: "Tuberías" },
];

const estadoInfo = {
  disponible: {
    label: "Disponible",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  "bajo stock": {
    label: "Bajo stock",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  agotado: {
    label: "Agotado",
    classes: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
} as const;

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fetchProductos = () =>
  getSupabase()
    .from("productos")
    .select(
      "id, nombre, subcategoria, descripcion, precio, unidad, estado, categorias(nombre)",
    )
    .neq("estado", "agotado")
    .order("nombre", { ascending: true });

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function CatalogoPage() {
  const [busqueda, setBusqueda] = useState("");
  const [subcategoria, setSubcategoria] = useState<Subcategoria | null>(null);
  const [items, setItems] = useState<ProductoCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchProductos())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setCargando(false);
          return;
        }
        const filas = (data ?? []) as unknown as FilaProducto[];
        setItems(
          filas.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            subcategoria: p.subcategoria,
            descripcion: p.descripcion,
            precio: p.precio,
            unidad: p.unidad,
            estado: p.estado,
            categoriaNombre: p.categorias?.nombre ?? "—",
          })),
        );
        setCargando(false);
      })
      .catch(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const termino = normalize(busqueda).trim();
    return items.filter((producto) => {
      const coincideNombre =
        !termino || normalize(producto.nombre).includes(termino);
      const coincideCategoria =
        !subcategoria || producto.subcategoria === subcategoria;
      return coincideNombre && coincideCategoria;
    });
  }, [busqueda, subcategoria, items]);

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Catálogo
            </h1>
            <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              Explora todos los materiales, kits y equipos disponibles para tu
              micro-obra.
            </p>
          </div>

          <label className="relative block md:w-80">
            <span className="sr-only">Buscar producto</span>
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="h-12 w-full rounded-full border border-zinc-300 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>
        </div>

        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="mt-8 flex flex-wrap gap-2"
        >
          <button
            type="button"
            onClick={() => setSubcategoria(null)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              subcategoria === null
                ? "border-red-600 bg-red-600 text-white"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            Todos
          </button>
          {subcategorias.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() =>
                setSubcategoria((actual) =>
                  actual === cat.value ? null : cat.value,
                )
              }
              aria-pressed={subcategoria === cat.value}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                subcategoria === cat.value
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {errorSupabase ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudieron cargar los productos.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        ) : cargando ? (
          <p className="mt-16 text-center text-zinc-500 dark:text-zinc-400">
            Cargando productos...
          </p>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtrados.map((producto) => {
                const estado = estadoInfo[producto.estado] ?? {
                  label: "Desconocido",
                  classes:
                    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                };
                return (
                  <article
                    key={producto.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-red-600/40 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div
                      aria-hidden
                      className="flex aspect-[4/3] items-center justify-center bg-zinc-100 dark:bg-zinc-800"
                    >
                      <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
                        <svg
                          className="h-8 w-8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <span className="text-xs font-medium">
                          {producto.categoriaNombre}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {producto.categoriaNombre}
                      </span>
                      <h2 className="mt-3 font-semibold leading-6 text-zinc-900 dark:text-zinc-50">
                        {producto.nombre}
                      </h2>
                      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {producto.descripcion ?? ""}
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                            {formatPrecio.format(producto.precio)}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            por {producto.unidad}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.classes}`}
                        >
                          {estado.label}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {filtrados.length === 0 && (
              <p className="mt-16 text-center text-zinc-500 dark:text-zinc-400">
                {busqueda
                  ? `No se encontraron productos para "${busqueda}".`
                  : "No se encontraron productos."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
