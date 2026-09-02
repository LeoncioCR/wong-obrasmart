"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

interface ProductoListado {
  id: string;
  nombre: string;
  categoria_id: string;
  categorias: { nombre: string } | null;
  precio: number;
  stock: number;
  unidad: string;
  imagen: string | null;
  estado: "disponible" | "bajo stock" | "agotado";
}

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
    classes:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
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
      "id, nombre, categoria_id, categorias(nombre), precio, stock, unidad, estado, imagen"
    )
    .order("nombre", { ascending: true });

export default function ProductosPage() {
  const [items, setItems] = useState<ProductoListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [confirmando, setConfirmando] = useState<ProductoListado | null>(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchProductos())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          setItems((data ?? []) as unknown as ProductoListado[]);
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

  const eliminar = async () => {
    if (!confirmando) return;
    setEliminando(true);
    setErrorSupabase("");

    const { error } = await getSupabase()
      .from("productos")
      .delete()
      .eq("id", confirmando.id);

    if (error) {
      setErrorSupabase(error.message);
      setEliminando(false);
      return;
    }

    setItems((actual) => actual.filter((producto) => producto.id !== confirmando.id));
    setConfirmando(null);
    setEliminando(false);
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Productos
            </h1>
            <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando productos..."
                : `${items.length} productos en el catálogo.`}
            </p>
          </div>

          <Link
            href="/dashboard/productos/nuevo"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
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
            Nuevo producto
          </Link>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo completar la operación.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando productos...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay productos registrados.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Producto
                    </th>
                    <th className="px-5 py-3 font-medium">Categoría</th>
                    <th className="px-5 py-3 font-medium">Precio</th>
                    <th className="px-5 py-3 font-medium">Stock</th>
                    <th className="px-5 py-3 font-medium">Unidad</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((producto) => {
                    const estado = estadoInfo[producto.estado] ?? {
                      label: "Desconocido",
                      classes:
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                    };
                    return (
                      <tr
                        key={producto.id}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                      >
                        <td className="sticky left-0 bg-white px-5 py-3.5 dark:bg-zinc-900">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                              {producto.imagen ? (
                                <Image
                                  src={producto.imagen}
                                  alt={producto.nombre}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 object-cover"
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="text-xs font-medium text-zinc-400 dark:text-zinc-500"
                                >
                                  {producto.nombre.slice(0, 1)}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {producto.nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {producto.categorias?.nombre ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                          {formatPrecio.format(producto.precio)}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                          {producto.stock}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {producto.unidad}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.classes}`}
                          >
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/productos/${producto.id}/editar`}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              Editar
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmando(producto)}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white dark:border-zinc-700 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                            >
                              Eliminar
                            </button>
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

      {confirmando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eliminar-producto-titulo"
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2
              id="eliminar-producto-titulo"
              className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
            >
              Eliminar producto
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {confirmando.nombre}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            {errorSupabase && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {errorSupabase}
              </p>
            )}
            <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                disabled={eliminando}
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={eliminar}
                disabled={eliminando}
                className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}