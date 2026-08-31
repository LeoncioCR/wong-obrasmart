"use client";

import { Suspense, useEffect, use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

import {
  errorClasses,
  fieldErrorClasses,
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";

const tiposDeObra = [
  "Nivelación y base de pisos",
  "Acabado de muros y superficies",
  "Construcción de muros",
  "Veredas y sardineles",
  "Remodelación y mantenimiento",
];

interface ProductoOpcion {
  id: string;
  nombre: string;
  unidad: string;
  categoria: string;
  subcategoria: string | null;
}

interface ItemEditable {
  rowId: string | null;
  productoId: string;
  nombre: string;
  tipo: "material" | "herramienta" | "maquinaria";
  cantidad: string;
  unidad: string;
  observacion: string;
}

interface FilaKitEdicion {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_obra: string;
  precio_referencial: number;
  estado: "activo" | "inactivo";
  kit_productos: {
    id: string;
    producto_id: string;
    tipo: "material" | "herramienta" | "maquinaria";
    cantidad: number;
    unidad: string;
    observacion: string | null;
    productos: { nombre: string } | null;
  }[];
}

const tipoDeProducto = (
  producto: ProductoOpcion | undefined
): "material" | "herramienta" | "maquinaria" => {
  if (producto?.subcategoria === "herramientas") return "herramienta";
  if (producto?.categoria === "Maquinaria") return "maquinaria";
  return "material";
};

const fetchProductos = () =>
  getSupabase()
    .from("productos")
    .select("id, nombre, unidad, subcategoria, categorias(nombre)")
    .order("nombre", { ascending: true });

function EditarPagina({ id }: { id: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoObra, setTipoObra] = useState("");
  const [precioReferencial, setPrecioReferencial] = useState("");
  const [estado, setEstado] = useState<"activo" | "inactivo">("activo");
  const [errores, setErrores] = useState<{
    nombre?: string;
    descripcion?: string;
    tipoObra?: string;
    precio?: string;
  }>({});

  const [productoActual, setProductoActual] = useState("");
  const [items, setItems] = useState<ItemEditable[]>([]);
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");

  const [errorKit, setErrorKit] = useState("");
  const [errorSupabase, setErrorSupabase] = useState("");
  const [procesando, setProcesando] = useState(false);
  const idsOriginales = useRef<Set<string>>(new Set());

  useEffect(() => {
    let activo = true;

    Promise.all([
      Promise.resolve(fetchProductos()),
      Promise.resolve(
        getSupabase()
          .from("kits")
          .select(
            "id, nombre, descripcion, tipo_obra, precio_referencial, estado, kit_productos(id, producto_id, tipo, cantidad, unidad, observacion, productos(nombre))"
          )
          .eq("id", id)
          .maybeSingle()
      ),
    ])
      .then(([resProductos, resKit]) => {
        if (!activo) return;

        if (resProductos.error) {
          setErrorProductos(resProductos.error.message);
        } else {
          const filasProductos = (resProductos.data ?? []) as unknown as {
            id: string;
            nombre: string;
            unidad: string;
            subcategoria: string | null;
            categorias: { nombre: string } | null;
          }[];
          setProductos(
            filasProductos.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              unidad: p.unidad,
              categoria: p.categorias?.nombre ?? "",
              subcategoria: p.subcategoria,
            }))
          );
        }
        setCargandoProductos(false);

        if (resKit.error) {
          setErrorCarga(resKit.error.message);
          setCargando(false);
          return;
        }
        if (!resKit.data) {
          setNoEncontrado(true);
          setCargando(false);
          return;
        }
        const fila = resKit.data as unknown as FilaKitEdicion;
        setNombre(fila.nombre);
        setDescripcion(fila.descripcion ?? "");
        setTipoObra(fila.tipo_obra);
        setPrecioReferencial(String(fila.precio_referencial));
        setEstado(fila.estado);
        const iniciales = (fila.kit_productos ?? []).map((kp) => ({
          rowId: kp.id,
          productoId: kp.producto_id,
          nombre: kp.productos?.nombre ?? "Producto no disponible",
          tipo: kp.tipo,
          cantidad: String(kp.cantidad),
          unidad: kp.unidad,
          observacion: kp.observacion ?? "",
        }));
        idsOriginales.current = new Set(iniciales.map((i) => i.rowId as string));
        setItems(iniciales);
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

  const productosDisponibles = productos.filter(
    (p) => !items.some((item) => item.productoId === p.id)
  );

  const agregarProducto = () => {
    const producto = productos.find((p) => p.id === productoActual);
    if (!producto) return;
    setItems((actual) => [
      ...actual,
      {
        rowId: null,
        productoId: producto.id,
        nombre: producto.nombre,
        tipo: tipoDeProducto(producto),
        cantidad: "1",
        unidad: producto.unidad,
        observacion: "",
      },
    ]);
    setProductoActual("");
    setErrorKit("");
  };

  const actualizarItem = (
    rowId: string | null,
    cambios: Partial<ItemEditable>
  ) => {
    setItems((actual) =>
      actual.map((item) =>
        item.rowId === rowId ? { ...item, ...cambios } : item
      )
    );
  };

  const quitarItem = (rowId: string | null, nombre: string) => {
    const confirmado = window.confirm(
      `¿Quitar "${nombre}" del kit? Esta acción se guardará al guardar los cambios.`
    );
    if (!confirmado) return;
    setItems((actual) => actual.filter((item) => item.rowId !== rowId));
  };

  const guardar = async () => {
    const nextErrores: typeof errores = {};
    if (!nombre.trim()) nextErrores.nombre = "Ingresa el nombre del kit.";
    if (!descripcion.trim())
      nextErrores.descripcion = "Ingresa una descripción breve.";
    if (!tipoObra) nextErrores.tipoObra = "Selecciona un tipo de obra.";
    const precioNum = Number(precioReferencial);
    if (precioReferencial.trim() === "" || !Number.isFinite(precioNum) || precioNum < 0) {
      nextErrores.precio = "Ingresa un precio referencial válido.";
    }
    setErrores(nextErrores);
    if (Object.values(nextErrores).some((err) => err)) return;

    if (items.length === 0) {
      setErrorKit("Agrega al menos un ítem al kit.");
      return;
    }

    setProcesando(true);
    setErrorSupabase("");
    setErrorKit("");

    const { error: errorUpdateKit } = await getSupabase()
      .from("kits")
      .update({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipo_obra: tipoObra,
        precio_referencial: precioNum,
        estado,
      })
      .eq("id", id);

    if (errorUpdateKit) {
      setErrorSupabase(errorUpdateKit.message);
      setProcesando(false);
      return;
    }

    const idsActuales = new Set(
      items.filter((i) => i.rowId).map((i) => i.rowId as string)
    );
    const idsAEliminar = [...idsOriginales.current].filter(
      (rowId) => !idsActuales.has(rowId)
    );

    const erroresGuardado: string[] = [];

    for (const rowId of idsAEliminar) {
      const { error } = await getSupabase()
        .from("kit_productos")
        .delete()
        .eq("id", rowId);
      if (error) erroresGuardado.push(error.message);
    }

    for (const item of items) {
      if (item.rowId) {
        const { error } = await getSupabase()
          .from("kit_productos")
          .update({
            tipo: item.tipo,
            cantidad: Number(item.cantidad),
            unidad: item.unidad.trim() || "unidad",
            observacion: item.observacion.trim() || null,
          })
          .eq("id", item.rowId);
        if (error) erroresGuardado.push(error.message);
      } else {
        const { error } = await getSupabase()
          .from("kit_productos")
          .insert({
            kit_id: id,
            producto_id: item.productoId,
            tipo: item.tipo,
            cantidad: Number(item.cantidad),
            unidad: item.unidad.trim() || "unidad",
            observacion: item.observacion.trim() || null,
          });
        if (error) erroresGuardado.push(error.message);
      }
    }

    if (erroresGuardado.length > 0) {
      setErrorSupabase(erroresGuardado[0]);
      setProcesando(false);
      return;
    }

    router.push(`/dashboard/kits/${id}`);
  };

  if (cargando) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando kit...
        </p>
      </div>
    );
  }

  if (noEncontrado) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Kit no encontrado
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            No existe un kit con el id &quot;{id}&quot;.
          </p>
          <Link
            href="/dashboard/kits"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
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
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            {errorCarga}
          </p>
          <Link
            href="/dashboard/kits"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
          >
            Volver a kits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
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

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Editar kit
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Modifica los datos del kit y su composición. Los cambios se guardan
          en la base de datos.
        </p>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo guardar el kit.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
          className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className={labelClasses}>
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrores((prev) => ({ ...prev, nombre: undefined }));
                }}
                className={`${inputClasses} ${fieldErrorClasses(!!errores.nombre)}`}
              />
              {errores.nombre && (
                <p className={errorClasses}>{errores.nombre}</p>
              )}
            </div>
            <div>
              <label htmlFor="tipoObra" className={labelClasses}>
                Tipo de obra
              </label>
              <select
                id="tipoObra"
                value={tipoObra}
                onChange={(e) => {
                  setTipoObra(e.target.value);
                  setErrores((prev) => ({ ...prev, tipoObra: undefined }));
                }}
                className={`${inputClasses} ${fieldErrorClasses(!!errores.tipoObra)}`}
              >
                <option value="" disabled>
                  Selecciona un tipo de obra
                </option>
                {tiposDeObra.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errores.tipoObra && (
                <p className={errorClasses}>{errores.tipoObra}</p>
              )}
            </div>
            <div>
              <label htmlFor="precio" className={labelClasses}>
                Precio referencial (S/)
              </label>
              <input
                id="precio"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={precioReferencial}
                onChange={(e) => {
                  setPrecioReferencial(e.target.value);
                  setErrores((prev) => ({ ...prev, precio: undefined }));
                }}
                className={`${inputClasses} ${fieldErrorClasses(!!errores.precio)}`}
              />
              {errores.precio && (
                <p className={errorClasses}>{errores.precio}</p>
              )}
            </div>
            <div>
              <label htmlFor="estado" className={labelClasses}>
                Estado
              </label>
              <select
                id="estado"
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value as "activo" | "inactivo")
                }
                className={inputClasses}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="descripcion" className={labelClasses}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setErrores((prev) => ({ ...prev, descripcion: undefined }));
              }}
              className={`${textareaClasses} ${fieldErrorClasses(!!errores.descripcion)}`}
            />
            {errores.descripcion && (
              <p className={errorClasses}>{errores.descripcion}</p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Composición del kit
            </h2>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                value={productoActual}
                onChange={(e) => setProductoActual(e.target.value)}
                className={`${inputClasses} sm:max-w-xs`}
              >
                <option value="" disabled>
                  {cargandoProductos
                    ? "Cargando productos..."
                    : "Selecciona un producto"}
                </option>
                {productosDisponibles.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={agregarProducto}
                disabled={!productoActual}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
              >
                Agregar producto
              </button>
            </div>
            {errorProductos && (
              <p className={`${errorClasses} mt-2`}>{errorProductos}</p>
            )}

            {items.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Este kit aún no tiene ítems.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {items.map((item, index) => (
                  <li
                    key={item.rowId ?? `nuevo-${index}`}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {item.nombre}
                      </p>
                      <button
                        type="button"
                        onClick={() => quitarItem(item.rowId, item.nombre)}
                        className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className={labelClasses}>Tipo</label>
                        <select
                          value={item.tipo}
                          onChange={(e) =>
                            actualizarItem(item.rowId, {
                              tipo: e.target.value as ItemEditable["tipo"],
                            })
                          }
                          className={inputClasses}
                        >
                          <option value="material">Material</option>
                          <option value="herramienta">Herramienta</option>
                          <option value="maquinaria">Maquinaria</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClasses}>Cantidad</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.cantidad}
                          onChange={(e) =>
                            actualizarItem(item.rowId, {
                              cantidad: e.target.value,
                            })
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Unidad</label>
                        <input
                          type="text"
                          value={item.unidad}
                          onChange={(e) =>
                            actualizarItem(item.rowId, {
                              unidad: e.target.value,
                            })
                          }
                          className={inputClasses}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className={labelClasses}>Observación</label>
                      <input
                        type="text"
                        value={item.observacion}
                        onChange={(e) =>
                          actualizarItem(item.rowId, {
                            observacion: e.target.value,
                          })
                        }
                        placeholder="Observación del ítem (opcional)"
                        className={inputClasses}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {errorKit && <p className={`${errorClasses} mt-3`}>{errorKit}</p>}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {procesando ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link
              href={`/dashboard/kits/${id}`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditarKitPage({
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
      <EditarContenido params={params} />
    </Suspense>
  );
}

function EditarContenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <EditarPagina id={id} />;
}
