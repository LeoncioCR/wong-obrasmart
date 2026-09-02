"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

interface ProductoAlerta {
  id: string;
  nombre: string;
  stock: number;
  unidad: string;
  estado: string;
}

interface ContadorEstado {
  clave: string;
  label: string;
  total: number;
}

interface ProductoTop {
  nombre: string;
  cantidad: number;
  operaciones: number;
}

interface ClienteFrecuente {
  id: string;
  nombre: string;
  cotizaciones: number;
  pedidos: number;
  alquileres: number;
  total: number;
  ultimaActividad: string;
}

interface MaquinaSolicitada {
  maquinaria_id: string;
  nombre: string;
  solicitudes: number;
  dias: number;
}

function Barra({
  nombre,
  total,
  maximo,
}: {
  nombre: string;
  total: number;
  maximo: number;
}) {
  const porcentaje = maximo > 0 ? (total / maximo) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {nombre}
        </p>
        <p className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
          {total}
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-red-600"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

const estadoClases: Record<string, string> = {
  "bajo stock":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  agotado: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function TablaProductosAlerta({
  titulo,
  productos,
}: {
  titulo: string;
  productos: ProductoAlerta[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
          {titulo}
        </h2>
      </div>
      {productos.length === 0 ? (
        <p className="px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400">
          Sin datos aún.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <th className="sticky left-0 z-10 px-6 py-3 font-medium">
                  Producto
                </th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr
                  key={producto.id}
                  className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                >
                  <td className="sticky left-0 bg-white px-6 py-3 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                    {producto.nombre}
                  </td>
                  <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                    {producto.stock} {producto.unidad}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        estadoClases[producto.estado] ??
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {producto.estado ?? "Desconocido"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SeccionEstados({
  titulo,
  items,
}: {
  titulo: string;
  items: ContadorEstado[];
}) {
  const total = items.reduce((n, item) => n + item.total, 0);
  const maximo = Math.max(1, ...items.map((item) => item.total));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {total} registro(s).
      </p>
      {total === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Sin datos aún.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {items.map((item) => (
            <Barra
              key={item.clave}
              nombre={item.label}
              total={item.total}
              maximo={maximo}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const ordenCotizaciones: [string, string][] = [
  ["nueva", "Nuevas"],
  ["en_revision", "En revisión"],
  ["cotizada", "Cotizadas"],
  ["aceptada", "Aceptadas"],
  ["rechazada", "Rechazadas"],
];

const ordenPedidos: [string, string][] = [
  ["pendiente", "Pendientes"],
  ["confirmado", "Confirmados"],
  ["preparando", "Preparando"],
  ["listo", "Listos"],
  ["entregado", "Entregados"],
  ["cancelado", "Cancelados"],
];

const ordenAlquileres: [string, string][] = [
  ["solicitado", "Solicitados"],
  ["reservado", "Reservados"],
  ["entregado", "Entregados"],
  ["devuelto", "Devueltos"],
  ["cancelado", "Cancelados"],
];

const formatoNumero = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
});

interface ResultadoConsulta<T> {
  ok: boolean;
  data: T;
  mensaje: string;
}

const ejecutar = async <T,>(
  promesa: PromiseLike<{ data: T | null; error: { message: string } | null }>,
): Promise<ResultadoConsulta<T>> => {
  try {
    const resultado = await Promise.resolve(promesa);
    if (resultado.error) {
      return { ok: false, data: null as T, mensaje: resultado.error.message };
    }
    return { ok: true, data: resultado.data as T, mensaje: "" };
  } catch {
    return {
      ok: false,
      data: null as T,
      mensaje: "Error de red al consultar Supabase.",
    };
  }
};

const contar = async (
  promesa: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
): Promise<{ ok: boolean; valor: number; mensaje: string }> => {
  try {
    const resultado = await Promise.resolve(promesa);
    if (resultado.error) {
      return { ok: false, valor: 0, mensaje: resultado.error.message };
    }
    return { ok: true, valor: resultado.count ?? 0, mensaje: "" };
  } catch {
    return {
      ok: false,
      valor: 0,
      mensaje: "Error de red al consultar Supabase.",
    };
  }
};

interface FilaEstado {
  estado: string;
}

interface FilaCotizacionDetalle {
  producto_id: string | null;
  cotizacion_id: string;
  cantidad: number;
  productos: { nombre: string }[] | null;
}

interface FilaPedidoDetalle {
  producto_id: string | null;
  pedido_id: string;
  cantidad: number;
  productos: { nombre: string }[] | null;
}

interface FilaCotizacionCliente {
  cliente_id: string;
  fecha_emision: string;
}

interface FilaPedidoCliente {
  cliente_id: string;
  fecha_pedido: string;
}

interface FilaAlquilerCliente {
  cliente_id: string;
  fecha_inicio: string;
}

interface FilaCliente {
  id: string;
  nombre: string;
}

interface FilaAlquilerMaquina {
  maquinaria_id: string;
  dias: number;
  maquinarias: { nombre: string }[] | null;
}

export default function DataObraPage() {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [resumen, setResumen] = useState({
    clientes: 0,
    cotizaciones: 0,
    pedidos: 0,
    alquileres: 0,
  });
  const [estadoCotizaciones, setEstadoCotizaciones] = useState<
    ContadorEstado[]
  >([]);
  const [estadoPedidos, setEstadoPedidos] = useState<ContadorEstado[]>([]);
  const [estadoAlquileres, setEstadoAlquileres] = useState<ContadorEstado[]>(
    [],
  );
  const [topProductos, setTopProductos] = useState<ProductoTop[]>([]);
  const [clientesFrecuentes, setClientesFrecuentes] = useState<
    ClienteFrecuente[]
  >([]);
  const [bajoStock, setBajoStock] = useState<ProductoAlerta[]>([]);
  const [agotados, setAgotados] = useState<ProductoAlerta[]>([]);
  const [maquinaSolicitada, setMaquinaSolicitada] = useState<
    MaquinaSolicitada[]
  >([]);

  useEffect(() => {
    let activo = true;

    const clasificar = (
      fila: FilaEstado[],
      orden: [string, string][],
    ): ContadorEstado[] =>
      orden.map(([clave, label]) => ({
        clave,
        label,
        total: fila.reduce((n, dato) => (dato.estado === clave ? n + 1 : n), 0),
      }));

    (async () => {
      const errores: string[] = [];
      const supabase = getSupabase();

      const conteos = await Promise.all([
        contar(
          supabase
            .from("clientes")
            .select("id", { count: "exact", head: true }),
        ),
        contar(
          supabase
            .from("cotizaciones")
            .select("id", { count: "exact", head: true }),
        ),
        contar(
          supabase.from("pedidos").select("id", { count: "exact", head: true }),
        ),
        contar(
          supabase
            .from("alquileres")
            .select("id", { count: "exact", head: true }),
        ),
      ]);
      conteos.forEach((conteo) => {
        if (!conteo.ok) errores.push(conteo.mensaje);
      });

      const [estCot, estPed, estAlq] = await Promise.all([
        ejecutar<FilaEstado[]>(supabase.from("cotizaciones").select("estado")),
        ejecutar<FilaEstado[]>(supabase.from("pedidos").select("estado")),
        ejecutar<FilaEstado[]>(supabase.from("alquileres").select("estado")),
      ]);
      [estCot, estPed, estAlq].forEach((resultado) => {
        if (!resultado.ok) errores.push(resultado.mensaje);
      });

      const [cotDet, pedDet] = await Promise.all([
        ejecutar<FilaCotizacionDetalle[]>(
          supabase
            .from("cotizacion_detalles")
            .select("producto_id, cotizacion_id, cantidad, productos(nombre)")
            .not("producto_id", "is", null),
        ),
        ejecutar<FilaPedidoDetalle[]>(
          supabase
            .from("pedido_detalles")
            .select("producto_id, pedido_id, cantidad, productos(nombre)")
            .not("producto_id", "is", null),
        ),
      ]);
      if (!cotDet.ok) errores.push(cotDet.mensaje);
      if (!pedDet.ok) errores.push(pedDet.mensaje);

      const [cots, peds, alqs, cli] = await Promise.all([
        ejecutar<FilaCotizacionCliente[]>(
          supabase.from("cotizaciones").select("cliente_id, fecha_emision"),
        ),
        ejecutar<FilaPedidoCliente[]>(
          supabase.from("pedidos").select("cliente_id, fecha_pedido"),
        ),
        ejecutar<FilaAlquilerCliente[]>(
          supabase.from("alquileres").select("cliente_id, fecha_inicio"),
        ),
        ejecutar<FilaCliente[]>(supabase.from("clientes").select("id, nombre")),
      ]);
      [cots, peds, alqs, cli].forEach((resultado) => {
        if (!resultado.ok) errores.push(resultado.mensaje);
      });

      const productosStock = await ejecutar<ProductoAlerta[]>(
        supabase
          .from("productos")
          .select("id, nombre, stock, unidad, estado")
          .in("estado", ["bajo stock", "agotado"]),
      );
      if (!productosStock.ok) errores.push(productosStock.mensaje);

      const catalogoProductos = await ejecutar<{ id: string; nombre: string }[]>(
        supabase.from("productos").select("id, nombre"),
      );
      if (!catalogoProductos.ok) errores.push(catalogoProductos.mensaje);

      const alqMaq = await ejecutar<FilaAlquilerMaquina[]>(
        supabase
          .from("alquileres")
          .select("maquinaria_id, dias, maquinarias(nombre)"),
      );
      if (!alqMaq.ok) errores.push(alqMaq.mensaje);

      if (!activo) return;

      setResumen({
        clientes: conteos[0].valor,
        cotizaciones: conteos[1].valor,
        pedidos: conteos[2].valor,
        alquileres: conteos[3].valor,
      });

      if (estCot.ok)
        setEstadoCotizaciones(clasificar(estCot.data, ordenCotizaciones));
      if (estPed.ok) setEstadoPedidos(clasificar(estPed.data, ordenPedidos));
      if (estAlq.ok)
        setEstadoAlquileres(clasificar(estAlq.data, ordenAlquileres));

      const nombrePorProductoId = new Map<string, string>(
        (catalogoProductos.ok ? catalogoProductos.data : []).map((p) => [
          p.id,
          p.nombre,
        ]),
      );

      const productosPorId = new Map<
        string,
        { nombre: string; cantidad: number; operaciones: Set<string> }
      >();
      const agregarProducto = (
        fila: {
          producto_id: string | null;
          cantidad: number;
          parentId: string;
        }[],
      ) => {
        fila.forEach((dato) => {
          if (!dato.producto_id) return;
          const nombre = nombrePorProductoId.get(dato.producto_id);
          if (!nombre) return;
          const actual = productosPorId.get(dato.producto_id) ?? {
            nombre,
            cantidad: 0,
            operaciones: new Set<string>(),
          };
          actual.cantidad += Number(dato.cantidad);
          actual.operaciones.add(dato.parentId);
          productosPorId.set(dato.producto_id, actual);
        });
      };
      if (cotDet.ok) {
        agregarProducto(
          cotDet.data.map((dato) => ({
            producto_id: dato.producto_id,
            cantidad: dato.cantidad,
            parentId: dato.cotizacion_id,
          })),
        );
      }
      if (pedDet.ok) {
        agregarProducto(
          pedDet.data.map((dato) => ({
            producto_id: dato.producto_id,
            cantidad: dato.cantidad,
            parentId: dato.pedido_id,
          })),
        );
      }
      setTopProductos(
        [...productosPorId.values()]
          .map((item) => ({
            nombre: item.nombre,
            cantidad: item.cantidad,
            operaciones: item.operaciones.size,
          }))
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 10),
      );

      if (cots.ok && peds.ok && alqs.ok && cli.ok) {
        const mapaClientes = new Map<
          string,
          {
            id: string;
            nombre: string;
            cotizaciones: number;
            pedidos: number;
            alquileres: number;
            ultima: Date | null;
          }
        >();
        cli.data.forEach((cliente) => {
          mapaClientes.set(cliente.id, {
            id: cliente.id,
            nombre: cliente.nombre,
            cotizaciones: 0,
            pedidos: 0,
            alquileres: 0,
            ultima: null,
          });
        });
        cots.data.forEach((dato) => {
          const cliente = mapaClientes.get(dato.cliente_id);
          if (!cliente) return;
          cliente.cotizaciones += 1;
          const fecha = new Date(`${dato.fecha_emision}T00:00:00`);
          if (!cliente.ultima || fecha > cliente.ultima) cliente.ultima = fecha;
        });
        peds.data.forEach((dato) => {
          const cliente = mapaClientes.get(dato.cliente_id);
          if (!cliente) return;
          cliente.pedidos += 1;
          const fecha = new Date(`${dato.fecha_pedido}T00:00:00`);
          if (!cliente.ultima || fecha > cliente.ultima) cliente.ultima = fecha;
        });
        alqs.data.forEach((dato) => {
          const cliente = mapaClientes.get(dato.cliente_id);
          if (!cliente) return;
          cliente.alquileres += 1;
          const fecha = new Date(`${dato.fecha_inicio}T00:00:00`);
          if (!cliente.ultima || fecha > cliente.ultima) cliente.ultima = fecha;
        });
        setClientesFrecuentes(
          [...mapaClientes.values()]
            .map((cliente) => ({
              id: cliente.id,
              nombre: cliente.nombre,
              cotizaciones: cliente.cotizaciones,
              pedidos: cliente.pedidos,
              alquileres: cliente.alquileres,
              total:
                cliente.cotizaciones + cliente.pedidos + cliente.alquileres,
              ultimaActividad: cliente.ultima
                ? cliente.ultima.toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
            }))
            .filter((cliente) => cliente.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10),
        );
      }

      if (productosStock.ok) {
        const ordenados = [...productosStock.data].sort(
          (a, b) => a.stock - b.stock,
        );
        setBajoStock(
          ordenados.filter((producto) => producto.estado === "bajo stock"),
        );
        setAgotados(
          ordenados.filter((producto) => producto.estado === "agotado"),
        );
      }

      if (alqMaq.ok) {
        const mapaMaquinas = new Map<
          string,
          {
            maquinaria_id: string;
            nombre: string;
            solicitudes: number;
            dias: number;
          }
        >();
        alqMaq.data.forEach((dato) => {
          const nombre = dato.maquinarias?.[0]?.nombre;
          if (!dato.maquinaria_id || !nombre) return;
          const actual = mapaMaquinas.get(dato.maquinaria_id) ?? {
            maquinaria_id: dato.maquinaria_id,
            nombre,
            solicitudes: 0,
            dias: 0,
          };
          actual.solicitudes += 1;
          actual.dias += dato.dias;
          mapaMaquinas.set(dato.maquinaria_id, actual);
        });
        setMaquinaSolicitada(
          [...mapaMaquinas.values()]
            .sort((a, b) => b.solicitudes - a.solicitudes)
            .slice(0, 10),
        );
      }

      setErrorCarga([...new Set(errores)].join(" · "));
      setCargando(false);
    })();

    return () => {
      activo = false;
    };
  }, []);

  const kpisResumen = [
    { label: "Clientes", valor: resumen.clientes },
    { label: "Cotizaciones", valor: resumen.cotizaciones },
    { label: "Pedidos", valor: resumen.pedidos },
    { label: "Alquileres", valor: resumen.alquileres },
  ];

  return (
    <div className="flex flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          DataObra
        </h1>
        <p className="mt-1.5 text-base text-zinc-600 dark:text-zinc-400">
          Panel de analítica en tiempo real con datos de la base de datos.
        </p>

        {errorCarga && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">
              Algunas métricas no se pudieron calcular.
            </p>
            <p className="mt-1">{errorCarga}</p>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando analítica...
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpisResumen.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
                >
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {kpi.valor}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <SeccionEstados
                titulo="Cotizaciones por estado"
                items={estadoCotizaciones}
              />
              <SeccionEstados
                titulo="Pedidos por estado"
                items={estadoPedidos}
              />
              <SeccionEstados
                titulo="Alquileres por estado"
                items={estadoAlquileres}
              />
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                  Productos más solicitados
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Suma de cantidades en cotizaciones y pedidos, con el número de
                  operaciones distintas.
                </p>
              </div>
              {topProductos.length === 0 ? (
                <p className="px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin datos aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <th className="px-6 py-3 font-medium">Producto</th>
                        <th className="px-6 py-3 text-right font-medium">
                          Cantidad total
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Operaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductos.map((producto, index) => (
                        <tr
                          key={`${producto.nombre}-${index}`}
                          className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                            {producto.nombre}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                            {formatoNumero.format(producto.cantidad)}
                          </td>
                          <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                            {producto.operaciones}
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
                  Clientes frecuentes
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Clientes con mayor número de operaciones en cotizaciones,
                  pedidos y alquileres.
                </p>
              </div>
              {clientesFrecuentes.length === 0 ? (
                <p className="px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin datos aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <th className="px-6 py-3 font-medium">Cliente</th>
                        <th className="px-6 py-3 text-right font-medium">
                          Cotizaciones
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Pedidos
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Alquileres
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Última actividad
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFrecuentes.map((cliente) => (
                        <tr
                          key={cliente.id}
                          className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                            {cliente.nombre}
                          </td>
                          <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                            {cliente.cotizaciones}
                          </td>
                          <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                            {cliente.pedidos}
                          </td>
                          <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                            {cliente.alquileres}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                            {cliente.total}
                          </td>
                          <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                            {cliente.ultimaActividad}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TablaProductosAlerta
                titulo="Productos con poco stock"
                productos={bajoStock}
              />
              <TablaProductosAlerta
                titulo="Productos agotados"
                productos={agotados}
              />
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                  Maquinaria más solicitada
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Número de solicitudes de alquiler por maquinaria y días total
                  reservados.
                </p>
              </div>
              {maquinaSolicitada.length === 0 ? (
                <p className="px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Sin datos aún.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <th className="px-6 py-3 font-medium">Maquinaria</th>
                        <th className="px-6 py-3 text-right font-medium">
                          Solicitudes
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Días totales
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {maquinaSolicitada.map((maquina) => (
                        <tr
                          key={maquina.maquinaria_id}
                          className="border-b border-zinc-100 last:border-0 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/60 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                            {maquina.nombre}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                            {maquina.solicitudes}
                          </td>
                          <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                            {maquina.dias}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
