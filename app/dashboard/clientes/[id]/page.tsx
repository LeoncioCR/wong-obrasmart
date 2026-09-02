"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

interface InfoCliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  created_at: string;
}

interface CotizacionFila {
  codigo: string;
  tipo_obra: string;
  fecha_emision: string;
  total: number;
  estado: string;
}

interface PedidoFila {
  codigo: string;
  fecha_pedido: string;
  total: number;
  estado: string;
}

interface AlquilerFila {
  codigo: string;
  maquinarias: { nombre: string } | null;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  total: number;
  estado: string;
}

const estadoClases: Record<string, string> = {
  nueva: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  en_revision:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  cotizada:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  aceptada:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  rechazada: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
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
  solicitado:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  reservado:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  devuelto:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
};

const estadoLabels: Record<string, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  cotizada: "Cotizada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
  solicitado: "Solicitado",
  reservado: "Reservado",
  devuelto: "Devuelto",
};

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const formatearFecha = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatearRegistro = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fetchCliente = (id: string) =>
  getSupabase()
    .from("clientes")
    .select("id, nombre, telefono, email, direccion, created_at")
    .eq("id", id)
    .maybeSingle();

const fetchRegistros = (id: string) => {
  const supabase = getSupabase();
  return Promise.all([
    Promise.resolve(
      supabase
        .from("cotizaciones")
        .select("codigo, tipo_obra, fecha_emision, total, estado")
        .eq("cliente_id", id)
        .order("fecha_emision", { ascending: false })
    ),
    Promise.resolve(
      supabase
        .from("pedidos")
        .select("codigo, fecha_pedido, total, estado")
        .eq("cliente_id", id)
        .order("fecha_pedido", { ascending: false })
    ),
    Promise.resolve(
      supabase
        .from("alquileres")
        .select(
          "codigo, maquinarias(nombre), fecha_inicio, fecha_fin, dias, total, estado"
        )
        .eq("cliente_id", id)
        .order("fecha_inicio", { ascending: false })
    ),
  ]);
};

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={`w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        estadoClases[estado] ??
        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {estadoLabels[estado] ?? estado}
    </span>
  );
}

export default function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Cargando cliente...
          </p>
        </div>
      }
    >
      <ClienteDetalle params={params} />
    </Suspense>
  );
}

function ClienteDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DetalleContenido id={id} />;
}

function DetalleContenido({ id }: { id: string }) {
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [cliente, setCliente] = useState<InfoCliente | null>(null);
  const [cotizaciones, setCotizaciones] = useState<CotizacionFila[]>([]);
  const [pedidos, setPedidos] = useState<PedidoFila[]>([]);
  const [alquileres, setAlquileres] = useState<AlquilerFila[]>([]);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchCliente(id))
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
        setCliente(data as unknown as InfoCliente);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo cargar el cliente.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [id]);

  useEffect(() => {
    if (!cliente) return;
    let activo = true;
    fetchRegistros(cliente.id)
      .then(([cot, ped, alq]) => {
        if (!activo) return;
        if (cot.error || ped.error || alq.error) {
          setErrorCarga(
            cot.error?.message ?? ped.error?.message ?? alq.error?.message ?? ""
          );
        } else {
          setCotizaciones(
            ((cot.data ?? []) as unknown as CotizacionFila[]) ?? []
          );
          setPedidos(((ped.data ?? []) as unknown as PedidoFila[]) ?? []);
          setAlquileres(((alq.data ?? []) as unknown as AlquilerFila[]) ?? []);
        }
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudieron cargar los registros del cliente.");
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [cliente]);

  if (cargando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando cliente...
        </p>
      </div>
    );
  }

  if (noEncontrado || !cliente) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cliente no encontrado
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          No existe un cliente con ese identificador.
        </p>
        <Link
          href="/dashboard/clientes"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
        >
          Volver a clientes
        </Link>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          No se pudo cargar el cliente
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          {errorCarga}
        </p>
        <Link
          href="/dashboard/clientes"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-600 px-8 text-base font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
        >
          Volver a clientes
        </Link>
      </div>
    );
  }

  const totalOperaciones = cotizaciones.length + pedidos.length + alquileres.length;
  const stats = [
    { label: "Cotizaciones", valor: cotizaciones.length },
    { label: "Pedidos", valor: pedidos.length },
    { label: "Alquileres", valor: alquileres.length },
    { label: "Total de operaciones", valor: totalOperaciones },
  ];

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/dashboard/clientes"
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
          Volver a clientes
        </Link>

        <div className="mt-6">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Cliente
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {cliente.nombre}
          </h1>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            {cliente.telefono}
            {cliente.email ? ` · ${cliente.email}` : ""}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Resumen de operaciones
            </h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 sm:grid-cols-4 sm:divide-y-0 dark:divide-zinc-800">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-5">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stat.valor}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
            Datos personales
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Nombre</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {cliente.nombre}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Teléfono</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {cliente.telefono}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {cliente.email ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Dirección</dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {cliente.direccion ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">
                Fecha de registro
              </dt>
              <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
                {formatearRegistro(cliente.created_at)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Cotizaciones del cliente
            </h2>
          </div>
          {cotizaciones.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              El cliente no tiene cotizaciones registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="px-6 py-3 font-medium">Código</th>
                    <th className="px-6 py-3 font-medium">Tipo de obra</th>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cotizacion) => (
                    <tr
                      key={cotizacion.codigo}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="px-6 py-3 font-semibold">
                        <Link
                          href={`/dashboard/cotizaciones/${cotizacion.codigo}`}
                          className="text-red-600 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                        >
                          {cotizacion.codigo}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {cotizacion.tipo_obra}
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatearFecha(cotizacion.fecha_emision)}
                      </td>
                      <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {formatPrecio.format(cotizacion.total)}
                      </td>
                      <td className="px-6 py-3">
                        <EstadoBadge estado={cotizacion.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Pedidos del cliente
            </h2>
          </div>
          {pedidos.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              El cliente no tiene pedidos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="px-6 py-3 font-medium">Código</th>
                    <th className="px-6 py-3 font-medium">Fecha</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr
                      key={pedido.codigo}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="px-6 py-3 font-semibold">
                        <Link
                          href={`/dashboard/pedidos/${pedido.codigo}`}
                          className="text-red-600 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                        >
                          {pedido.codigo}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatearFecha(pedido.fecha_pedido)}
                      </td>
                      <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {formatPrecio.format(pedido.total)}
                      </td>
                      <td className="px-6 py-3">
                        <EstadoBadge estado={pedido.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Alquileres del cliente
            </h2>
          </div>
          {alquileres.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              El cliente no tiene alquileres registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="px-6 py-3 font-medium">Código</th>
                    <th className="px-6 py-3 font-medium">Maquinaria</th>
                    <th className="px-6 py-3 font-medium">Fechas</th>
                    <th className="px-6 py-3 font-medium">Días</th>
                    <th className="px-6 py-3 font-medium">Total</th>
                    <th className="px-6 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alquileres.map((alquiler) => (
                    <tr
                      key={alquiler.codigo}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="px-6 py-3 font-semibold">
                        <Link
                          href={`/dashboard/alquileres/${alquiler.codigo}`}
                          className="text-red-600 transition-colors hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                        >
                          {alquiler.codigo}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {alquiler.maquinarias?.nombre ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatearFecha(alquiler.fecha_inicio)} al{" "}
                        {formatearFecha(alquiler.fecha_fin)}
                      </td>
                      <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                        {alquiler.dias}
                      </td>
                      <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {formatPrecio.format(alquiler.total)}
                      </td>
                      <td className="px-6 py-3">
                        <EstadoBadge estado={alquiler.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}