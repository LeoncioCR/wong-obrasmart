"use client";

import { Suspense, useEffect, use, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

interface KitItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  unidad: string;
  precio: number;
  observacion: string | null;
  subtotal: number | null;
}

interface KitDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_obra: string;
  precio_referencial: number;
  estado: "activo" | "inactivo";
  materiales: KitItem[];
  herramientas: KitItem[];
  maquinaria: KitItem[];
}

interface FilaKit {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_obra: string;
  precio_referencial: number;
  estado: "activo" | "inactivo";
  kit_productos: {
    id: string;
    tipo: "material" | "herramienta" | "maquinaria";
    cantidad: number;
    unidad: string;
    observacion: string | null;
    productos: {
      nombre: string;
      descripcion: string | null;
      precio: number;
    } | null;
  }[];
}

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const formatCantidad = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

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

const fetchKit = (id: string) =>
  getSupabase()
    .from("kits")
    .select(
      "id, nombre, descripcion, tipo_obra, precio_referencial, estado, kit_productos(id, tipo, cantidad, unidad, observacion, productos(nombre, descripcion, precio))"
    )
    .eq("id", id)
    .maybeSingle();

function ItemList({ items, title }: { items: KitItem[]; title: string }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Este kit no incluye {title.toLowerCase()}.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {item.nombre}
                  </p>
                  {item.descripcion ? (
                    <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {item.descripcion}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatCantidad.format(item.cantidad)} {item.unidad}
                    {item.precio > 0
                      ? ` · ${formatPrecio.format(item.precio)}/${item.unidad}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.subtotal !== null
                    ? formatPrecio.format(item.subtotal)
                    : "—"}
                </span>
              </div>
              {item.observacion ? (
                <p className="mt-1.5 text-xs italic text-zinc-500 dark:text-zinc-400">
                  {item.observacion}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function KitDetalleAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Cargando kit...
          </p>
        </div>
      }
    >
      <KitDetalle params={params} />
    </Suspense>
  );
}

function KitDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <KitContenido id={id} />;
}

function KitContenido({ id }: { id: string }) {
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [kit, setKit] = useState<KitDetalle | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchKit(id))
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
        const fila = data as unknown as FilaKit;
        const agrupar = (tipo: FilaKit["kit_productos"][number]["tipo"]) =>
          (fila.kit_productos ?? [])
            .filter((kp) => kp.tipo === tipo)
            .map((kp) => ({
              id: kp.id,
              nombre: kp.productos?.nombre ?? "Producto no disponible",
              descripcion: kp.productos?.descripcion ?? null,
              cantidad: kp.cantidad,
              unidad: kp.unidad,
              precio: kp.productos?.precio ?? 0,
              observacion: kp.observacion,
              subtotal:
                kp.productos && kp.productos.precio > 0
                  ? Math.round(kp.productos.precio * kp.cantidad * 100) / 100
                  : null,
            }));
        setKit({
          id: fila.id,
          nombre: fila.nombre,
          descripcion: fila.descripcion,
          tipo_obra: fila.tipo_obra,
          precio_referencial: fila.precio_referencial,
          estado: fila.estado,
          materiales: agrupar("material"),
          herramientas: agrupar("herramienta"),
          maquinaria: agrupar("maquinaria"),
        });
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo cargar el kit.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando kit...
        </p>
      </div>
    );
  }

  if (noEncontrado || !kit) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Kit no encontrado
          </h1>
          <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
            No existe un kit con el id &quot;{id}&quot;.
          </p>
          <Link
            href="/dashboard/kits"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
          >
            Volver a kits
          </Link>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            No se pudo cargar el kit
          </h1>
          <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
            {errorCarga}
          </p>
          <Link
            href="/dashboard/kits"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
          >
            Volver a kits
          </Link>
        </div>
      </div>
    );
  }

  const badge = estadoBadge[kit.estado] ?? {
    label: "Desconocido",
    classes:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/dashboard/kits"
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
          Volver a kits
        </Link>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {kit.tipo_obra}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
              >
                {badge.label}
              </span>
            </div>
            <Link
              href={`/dashboard/kits/${kit.id}/editar`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
            >
              Editar kit
            </Link>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {kit.nombre}
          </h1>
          {kit.descripcion ? (
            <p className="mt-1.5 max-w-3xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
              {kit.descripcion}
            </p>
          ) : null}

          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Precio referencial
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrecio.format(kit.precio_referencial)}
              </p>
            </div>
            <div className="ml-6">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ítems totales
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {kit.materiales.length +
                  kit.herramientas.length +
                  kit.maquinaria.length}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div>
            <ItemList title="Materiales" items={kit.materiales} />
          </div>
          <div>
            <ItemList title="Herramientas" items={kit.herramientas} />
          </div>
          <div>
            <ItemList title="Maquinaria" items={kit.maquinaria} />
          </div>
        </div>
      </div>
    </div>
  );
}
