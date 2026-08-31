"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

interface KitItem {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
}

interface KitDetalle {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_obra: string;
  precio_referencial: number;
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
  kit_productos: {
    id: string;
    tipo: "material" | "herramienta" | "maquinaria";
    cantidad: number;
    unidad: string;
    productos: { nombre: string } | null;
  }[];
}

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const formatCantidad = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

const fetchKit = (id: string) =>
  getSupabase()
    .from("kits")
    .select(
      "id, nombre, descripcion, tipo_obra, precio_referencial, kit_productos(id, tipo, cantidad, unidad, productos(nombre))"
    )
    .eq("id", id)
    .maybeSingle();

function ItemList({ items, title }: { items: KitItem[]; title: string }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {item.nombre}
            </span>
            <span className="shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {formatCantidad.format(item.cantidad)} {item.unidad}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function KitDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
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

function KitDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
              cantidad: kp.cantidad,
              unidad: kp.unidad,
            }));
        setKit({
          id: fila.id,
          nombre: fila.nombre,
          descripcion: fila.descripcion,
          tipo_obra: fila.tipo_obra,
          precio_referencial: fila.precio_referencial,
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
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando kit...
        </p>
      </div>
    );
  }

  if (noEncontrado || !kit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Kit no encontrado
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          No existe un kit con el id &quot;{id}&quot;.
        </p>
        <Link
          href="/kits"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Volver a kits
        </Link>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          No se pudo cargar el kit
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {errorCarga}
        </p>
        <Link
          href="/kits"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Volver a kits
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/kits"
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
          <span className="w-fit rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {kit.tipo_obra}
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            {kit.nombre}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {kit.descripcion}
          </p>

          <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Precio estimado
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrecio.format(kit.precio_referencial)}
              </p>
            </div>
            <Link
              href="/cotizar"
              className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
            >
              Solicitar cotización
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ItemList title="Materiales" items={kit.materiales} />
          </div>
          <div className="lg:col-span-1">
            <ItemList title="Herramientas sugeridas" items={kit.herramientas} />
          </div>
          <div className="lg:col-span-1">
            <ItemList title="Maquinaria sugerida" items={kit.maquinaria} />
          </div>
        </div>
      </div>
    </div>
  );
}