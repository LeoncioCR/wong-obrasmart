"use client";

import { useEffect, useMemo, useState } from "react";
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

interface Pedido {
  id: string;
  codigo: string;
  cliente: string;
  cotizacion: string | null;
  fecha: string;
  total: number;
  estado: EstadoPedido;
}

interface FilaPedido {
  id: string;
  codigo: string;
  fecha_pedido: string;
  total: number;
  estado: EstadoPedido;
  clientes: { nombre: string } | null;
  cotizaciones: { codigo: string } | null;
}

interface FilaCandidata {
  id: string;
  codigo: string;
  tipo_obra: string;
  total: number;
  fecha_emision: string;
  clientes: { nombre: string } | null;
}

interface Candidata {
  id: string;
  codigo: string;
  cliente: string;
  tipoObra: string;
  total: number;
  fecha: string;
}

const estadoInfo: Record<EstadoPedido, { label: string; classes: string }> = {
  pendiente: {
    label: "Pendiente",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  confirmado: {
    label: "Confirmado",
    classes:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  preparando: {
    label: "Preparando",
    classes:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  listo: {
    label: "Listo",
    classes: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  },
  entregado: {
    label: "Entregado",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  cancelado: {
    label: "Cancelado",
    classes:
      "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const obtenerFecha = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fetchPedidos = () =>
  getSupabase()
    .from("pedidos")
    .select(
      "id, codigo, fecha_pedido, total, estado, clientes(nombre), cotizaciones(codigo)"
    )
    .order("fecha_pedido", { ascending: false });

const convertirFila = (fila: FilaPedido): Pedido => ({
  id: fila.id,
  codigo: fila.codigo,
  cliente: fila.clientes?.nombre ?? "—",
  cotizacion: fila.cotizaciones?.codigo ?? null,
  fecha: obtenerFecha(fila.fecha_pedido),
  total: fila.total,
  estado: fila.estado,
});

const convertirCandidata = (fila: FilaCandidata): Candidata => ({
  id: fila.id,
  codigo: fila.codigo,
  cliente: fila.clientes?.nombre ?? "—",
  tipoObra: fila.tipo_obra,
  total: fila.total,
  fecha: obtenerFecha(fila.fecha_emision),
});

export default function PedidosPage() {
  const [items, setItems] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPedido | "todos">("todos");

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [candidatas, setCandidatas] = useState<Candidata[]>([]);
  const [cargandoCandidatas, setCargandoCandidatas] = useState(false);
  const [errorConvertir, setErrorConvertir] = useState("");
  const [convirtiendoId, setConvirtiendoId] = useState<string | null>(null);
  const [convertida, setConvertida] = useState<{
    cotCodigo: string;
    pedCodigo: string;
  } | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchPedidos())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          setItems(
            ((data ?? []) as unknown as FilaPedido[]).map(convertirFila)
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

  const filtradas = useMemo(() => {
    if (estado === "todos") return items;
    return items.filter((pedido) => pedido.estado === estado);
  }, [items, estado]);

  const cambiarEstado = async (id: string, nuevo: EstadoPedido) => {
    if (actualizandoId) return;
    setActualizandoId(id);
    setErrorSupabase("");
    const { error } = await getSupabase()
      .from("pedidos")
      .update({ estado: nuevo })
      .eq("id", id);
    if (error) {
      setErrorSupabase(error.message);
      setActualizandoId(null);
      return;
    }
    setItems((actual) =>
      actual.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: nuevo } : pedido
      )
    );
    setActualizandoId(null);
  };

  const cargarCandidatas = async () => {
    setCargandoCandidatas(true);
    setErrorConvertir("");
    const supabase = getSupabase();

    const { data: usadas, error: errorUsadas } = await supabase
      .from("pedidos")
      .select("cotizacion_id");
    if (errorUsadas) {
      setErrorConvertir(errorUsadas.message);
      setCargandoCandidatas(false);
      return;
    }
    const cotizacionesConPedido = new Set(
      (usadas ?? [])
        .map((fila) => fila.cotizacion_id)
        .filter((valor): valor is string => Boolean(valor))
    );

    const { data, error } = await supabase
      .from("cotizaciones")
      .select("id, codigo, tipo_obra, total, fecha_emision, clientes(nombre)")
      .eq("estado", "aceptada")
      .order("fecha_emision", { ascending: false });
    if (error) {
      setErrorConvertir(error.message);
      setCargandoCandidatas(false);
      return;
    }

    const pendientes = ((data ?? []) as unknown as FilaCandidata[]).filter(
      (fila) => !cotizacionesConPedido.has(fila.id)
    );
    setCandidatas(pendientes.map(convertirCandidata));
    setCargandoCandidatas(false);
  };

  const abrirPanel = () => {
    setPanelAbierto((abierto) => {
      if (!abierto) void cargarCandidatas();
      return !abierto;
    });
  };

  const convertir = async (candidata: Candidata) => {
    if (convirtiendoId) return;
    setConvirtiendoId(candidata.id);
    setErrorConvertir("");
    setConvertida(null);
    const supabase = getSupabase();

    const { data: filaRaw, error: errorFila } = await supabase
      .from("cotizaciones")
      .select(
        "id, cliente_id, total, cotizacion_detalles(producto_id, descripcion, cantidad, unidad, precio_unitario, subtotal)"
      )
      .eq("id", candidata.id)
      .maybeSingle();
    if (errorFila || !filaRaw) {
      setErrorConvertir(errorFila?.message ?? "No se pudo leer la cotización.");
      setConvirtiendoId(null);
      return;
    }
    const filaCot = filaRaw as unknown as {
      cliente_id: string;
      total: number;
      cotizacion_detalles: {
        producto_id: string | null;
        descripcion: string;
        cantidad: number;
        unidad: string;
        precio_unitario: number;
        subtotal: number;
      }[];
    };

    const { data: duplicado } = await supabase
      .from("pedidos")
      .select("id")
      .eq("cotizacion_id", candidata.id)
      .maybeSingle();
    if (duplicado) {
      setErrorConvertir("Esta cotización ya tiene un pedido asociado.");
      setCandidatas((actual) =>
        actual.filter((c) => c.id !== candidata.id)
      );
      setConvirtiendoId(null);
      return;
    }

    const { data: codigosExistentes } = await supabase
      .from("pedidos")
      .select("codigo");
    const siguienteNumero =
      (((codigosExistentes ?? []) as unknown as { codigo: string }[])
        .map((f) => Number(/PED-(\d+)/.exec(f.codigo)?.[1] ?? 0))
        .reduce((max, n) => Math.max(max, n), 0) || 0) + 1;
    const pedidoCodigo = `PED-${String(siguienteNumero).padStart(3, "0")}`;

    const hoy = new Date();
    const fechaHoy = `${hoy.getFullYear()}-${String(
      hoy.getMonth() + 1
    ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

    const { data: insertado, error: errorInsertar } = await supabase
      .from("pedidos")
      .insert({
        codigo: pedidoCodigo,
        cliente_id: filaCot.cliente_id,
        cotizacion_id: candidata.id,
        fecha_pedido: fechaHoy,
        total: filaCot.total,
        estado: "pendiente",
        observaciones: null,
      })
      .select("id")
      .single();

    if (errorInsertar) {
      if (/duplicate key/i.test(errorInsertar.message)) {
        setErrorConvertir("Esta cotización ya tiene un pedido asociado.");
        setCandidatas((actual) =>
          actual.filter((c) => c.id !== candidata.id)
        );
      } else {
        setErrorConvertir(errorInsertar.message);
      }
      setConvirtiendoId(null);
      return;
    }

    const pedidoId = (insertado as unknown as { id: string }).id;
    if (filaCot.cotizacion_detalles.length > 0) {
      const { error: errorDetalles } = await supabase
        .from("pedido_detalles")
        .insert(
          filaCot.cotizacion_detalles.map((detalle) => ({
            pedido_id: pedidoId,
            producto_id: detalle.producto_id,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidad,
            unidad: detalle.unidad,
            precio_unitario: detalle.precio_unitario,
            subtotal: detalle.subtotal,
          }))
        );
      if (errorDetalles) {
        setErrorConvertir(errorDetalles.message);
        setConvirtiendoId(null);
        return;
      }
    }

    setCandidatas((actual) =>
      actual.filter((c) => c.id !== candidata.id)
    );
    setConvertida({ cotCodigo: candidata.codigo, pedCodigo: pedidoCodigo });
    setConvirtiendoId(null);

    const resultado = await fetchPedidos();
    if (!resultado.error) {
      setItems(
        ((resultado.data ?? []) as unknown as FilaPedido[]).map(convertirFila)
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Pedidos
            </h1>
            <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando pedidos..."
                : errorSupabase
                  ? "No se pudieron cargar los pedidos."
                  : `${filtradas.length} de ${items.length} pedidos registrados.`}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="w-full sm:w-52">
              <span className="sr-only">Filtrar por estado</span>
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value as EstadoPedido | "todos")
                }
                className="h-12 w-full cursor-pointer rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 outline-none transition-colors focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <option value="todos">Todos los estados</option>
                {estados.map((estadoActual) => (
                  <option key={estadoActual} value={estadoActual}>
                    {estadoInfo[estadoActual]?.label ?? "Desconocido"}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={abrirPanel}
              className="h-12 w-fit rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition-all hover:bg-red-700 hover:shadow-md"
            >
              Convertir cotización aceptada
            </button>
          </div>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">
              {actualizandoId
                ? "No se pudo cambiar el estado."
                : "No se pudieron cargar los pedidos."}
            </p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {convertida && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <p>
              Pedido <span className="font-semibold">{convertida.pedCodigo}</span>{" "}
              creado desde la cotización {convertida.cotCodigo}.
            </p>
            <Link
              href={`/dashboard/pedidos/${convertida.pedCodigo}`}
              className="rounded-full border border-emerald-300 px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-emerald-100 dark:border-emerald-500/50 dark:hover:bg-emerald-500/10"
            >
              Ver pedido
            </Link>
          </div>
        )}

        {panelAbierto && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                  Cotizaciones aceptadas
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Solo se muestran cotizaciones que aún no generan pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void cargarCandidatas()}
                disabled={cargandoCandidatas}
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Actualizar
              </button>
            </div>

            {errorConvertir && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <p className="font-medium">No se pudo convertir.</p>
                <p className="mt-1">{errorConvertir}</p>
              </div>
            )}

            {cargandoCandidatas ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Cargando cotizaciones aceptadas...
              </p>
            ) : candidatas.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                No hay cotizaciones aceptadas pendientes de convertir.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <th className="px-5 py-3 font-medium">Código</th>
                        <th className="px-5 py-3 font-medium">Cliente</th>
                        <th className="px-5 py-3 font-medium">
                          Tipo de obra
                        </th>
                        <th className="px-5 py-3 font-medium">Total</th>
                        <th className="px-5 py-3 font-medium">Fecha</th>
                        <th className="px-5 py-3 text-right font-medium">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidatas.map((candidata) => (
                        <tr
                          key={candidata.id}
                          className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                            {candidata.codigo}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                            {candidata.cliente}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                            {candidata.tipoObra}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                            {formatPrecio.format(candidata.total)}
                          </td>
                          <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                            {candidata.fecha}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => void convertir(candidata)}
                                disabled={convirtiendoId !== null}
                                className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition-all shadow-sm shadow-red-600/30 hover:bg-red-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {convirtiendoId === candidata.id
                                  ? "Convirtiendo..."
                                  : "Convertir"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando pedidos...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay pedidos registrados.
          </div>
        ) : filtradas.length === 0 ? (
          <>
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No hay pedidos con el estado seleccionado.
            </div>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              Mostrando {filtradas.length} de {items.length} pedidos.
            </p>
          </>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Código
                    </th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">
                      Cotización origen
                    </th>
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((pedido) => {
                    const estado = estadoInfo[pedido.estado] ?? {
                      label: "Desconocido",
                      classes:
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                    };
                    return (
                      <tr
                        key={pedido.id}
                        className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                      >
                        <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                          {pedido.codigo}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                          {pedido.cliente}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {pedido.cotizacion ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                          {pedido.fecha}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                          {formatPrecio.format(pedido.total)}
                        </td>
                        <td className="px-5 py-3.5">
                          <label className="relative inline-block">
                            <span className="sr-only">Cambiar estado</span>
                            <select
                              value={pedido.estado}
                              onChange={(e) =>
                                void cambiarEstado(
                                  pedido.id,
                                  e.target.value as EstadoPedido
                                )
                              }
                              disabled={actualizandoId !== null}
                              title="Cambiar estado"
                              className={`cursor-pointer appearance-none rounded-full px-3 py-1 pr-7 text-xs font-semibold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${estado.classes}`}
                            >
                              {estados.map((estadoActual) => (
                                <option
                                  key={estadoActual}
                                  value={estadoActual}
                                >
                                  {estadoInfo[estadoActual]?.label ??
                                    "Desconocido"}
                                </option>
                              ))}
                            </select>
                            <svg
                              className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-current opacity-70"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </label>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex justify-end">
                            <Link
                              href={`/dashboard/pedidos/${pedido.codigo}`}
                              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              Ver detalle
                            </Link>
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
    </div>
  );
}