"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

type EstadoPedido =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

const estados: EstadoPedido[] = [
  "pendiente",
  "confirmado",
  "preparando",
  "listo",
  "entregado",
  "cancelado",
];

interface ItemDetalle {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
}

interface DetallePedido {
  codigo: string;
  cotizacion: string | null;
  cliente: {
    nombre: string;
    telefono: string;
    email: string | null;
    direccion: string | null;
  } | null;
  fecha: string;
  estado: EstadoPedido;
  observaciones: string | null;
  total: number;
  items: ItemDetalle[];
}

interface FilaPedido {
  id: string;
  codigo: string;
  fecha_pedido: string;
  total: number;
  estado: EstadoPedido;
  observaciones: string | null;
  cotizaciones: { codigo: string } | null;
  clientes: {
    nombre: string;
    telefono: string;
    email: string | null;
    direccion: string | null;
  } | null;
  pedido_detalles: {
    id: string;
    descripcion: string;
    cantidad: number;
    unidad: string;
    precio_unitario: number;
    subtotal: number;
  }[];
}

const estadoClases: Record<EstadoPedido, string> = {
  pendiente:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  confirmado:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  preparando:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  listo: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  entregado:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const estadoLabels: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const formatPrecio00 = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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

const fetchPedido = (codigo: string) =>
  getSupabase()
    .from("pedidos")
    .select(
      "id, codigo, fecha_pedido, total, estado, observaciones, cotizaciones(codigo), clientes(nombre, telefono, email, direccion), pedido_detalles(id, descripcion, cantidad, unidad, precio_unitario, subtotal)"
    )
    .eq("codigo", codigo)
    .maybeSingle();

export default function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Cargando pedido...
          </p>
        </div>
      }
    >
      <PedidoDetalle params={params} />
    </Suspense>
  );
}

function PedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DetalleContenido codigo={id} />;
}

function DetalleContenido({ codigo }: { codigo: string }) {
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [detalle, setDetalle] = useState<DetallePedido | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchPedido(codigo))
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
        const fila = data as unknown as FilaPedido;
        setDetalle({
          codigo: fila.codigo,
          cotizacion: fila.cotizaciones?.codigo ?? null,
          cliente: fila.clientes,
          fecha: obtenerFecha(fila.fecha_pedido),
          estado: fila.estado,
          observaciones: fila.observaciones,
          total: fila.total,
          items: (fila.pedido_detalles ?? []).map((d) => ({
            id: d.id,
            descripcion: d.descripcion,
            cantidad: d.cantidad,
            unidad: d.unidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal,
          })),
        });
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo cargar el pedido.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [codigo]);

  const cambiarEstado = async (nuevo: EstadoPedido) => {
    if (!detalle || nuevo === detalle.estado || actualizando) return;
    setActualizando(true);
    setErrorEstado("");
    const { error } = await getSupabase()
      .from("pedidos")
      .update({ estado: nuevo })
      .eq("codigo", codigo);
    if (error) {
      setErrorEstado(error.message);
      setActualizando(false);
      return;
    }
    setDetalle({ ...detalle, estado: nuevo });
    setActualizando(false);
  };

  if (cargando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando pedido...
        </p>
      </div>
    );
  }

  if (noEncontrado || !detalle) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pedido no encontrado
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          No existe un pedido con el código &quot;{codigo}&quot;.
        </p>
        <Link
          href="/dashboard/pedidos"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
        >
          Volver a pedidos
        </Link>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          No se pudo cargar el pedido
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          {errorCarga}
        </p>
        <Link
          href="/dashboard/pedidos"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
        >
          Volver a pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/dashboard/pedidos"
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
          Volver a pedidos
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Pedido
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
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
                  void cambiarEstado(e.target.value as EstadoPedido)
                }
                disabled={actualizando}
                className="h-10 w-44 cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 text-xs font-semibold text-zinc-700 outline-none transition-colors focus:border-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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

        {errorEstado && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo cambiar el estado.</p>
            <p className="mt-1">{errorEstado}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
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

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Información del pedido
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Fecha del pedido
                </dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.fecha}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">Estado</dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {estadoLabels[detalle.estado]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Cotización relacionada
                </dt>
                <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                  {detalle.cotizacion ? (
                    <Link
                      href={`/dashboard/cotizaciones/${detalle.cotizacion}`}
                      className="text-red-600 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                    >
                      {detalle.cotizacion}
                    </Link>
                  ) : (
                    "—"
                  )}
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

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Detalles
            </h2>
          </div>
          {detalle.items.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              No hay detalles registrados para este pedido.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-6 py-3 font-medium">
                      Descripción
                    </th>
                    <th className="px-6 py-3 font-medium">Cantidad</th>
                    <th className="px-6 py-3 font-medium">Precio</th>
                    <th className="px-6 py-3 text-right font-medium">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="sticky left-0 bg-white px-6 py-3 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                        {item.descripcion}
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatCantidad.format(item.cantidad)} {item.unidad}
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatPrecio.format(item.precio_unitario)}
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                        {formatPrecio00.format(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Total</p>
            <p className="ml-8 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatPrecio00.format(detalle.total)}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}