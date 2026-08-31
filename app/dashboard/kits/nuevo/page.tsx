"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

interface ProductoSeleccionado {
  id: string;
  nombre: string;
  cantidad: string;
  observacion: string;
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
    .select(
      "id, nombre, unidad, subcategoria, categorias(nombre)"
    )
    .order("nombre", { ascending: true });

export default function NuevoKitPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoObra, setTipoObra] = useState("");
  const [estado, setEstado] = useState<"activo" | "inactivo">("activo");
  const [productoActual, setProductoActual] = useState("");
  const [seleccionados, setSeleccionados] = useState<
    ProductoSeleccionado[]
  >([]);
  const [productos, setProductos] = useState<ProductoOpcion[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState("");
  const [errores, setErrores] = useState<{
    nombre?: string;
    descripcion?: string;
    tipoObra?: string;
  }>({});
  const [errorKit, setErrorKit] = useState("");
  const [errorSupabase, setErrorSupabase] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchProductos())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorProductos(error.message);
        } else {
          const filas = (data ?? []) as unknown as {
            id: string;
            nombre: string;
            unidad: string;
            subcategoria: string | null;
            categorias: { nombre: string } | null;
          }[];
          setProductos(
            filas.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              unidad: p.unidad,
              categoria: p.categorias?.nombre ?? "",
              subcategoria: p.subcategoria,
            }))
          );
        }
        setCargandoProductos(false);
      })
      .catch(() => {
        if (activo) {
          setErrorProductos("No se pudieron cargar los productos.");
          setCargandoProductos(false);
        }
      });
    return () => {
      activo = false;
    };
  }, []);

  const productosDisponibles = productos.filter(
    (p) => !seleccionados.some((sel) => sel.id === p.id)
  );

  const agregarProducto = () => {
    const producto = productos.find((p) => p.id === productoActual);
    if (!producto) return;
    setSeleccionados((actual) => [
      ...actual,
      {
        id: producto.id,
        nombre: producto.nombre,
        cantidad: "1",
        observacion: "",
      },
    ]);
    setProductoActual("");
    setErrorKit("");
  };

  const quitarProducto = (id: string) => {
    setSeleccionados((actual) => actual.filter((sel) => sel.id !== id));
  };

  const guardar = async () => {
    const nextErrores: typeof errores = {};
    if (!nombre.trim()) nextErrores.nombre = "Ingresa el nombre del kit.";
    if (!descripcion.trim())
      nextErrores.descripcion = "Ingresa una descripción breve.";
    if (!tipoObra) nextErrores.tipoObra = "Selecciona un tipo de obra.";
    setErrores(nextErrores);
    if (Object.values(nextErrores).some((err) => err)) return;

    if (seleccionados.length === 0) {
      setErrorKit("Agrega al menos un producto al kit.");
      return;
    }

    setProcesando(true);
    setErrorSupabase("");

    const { data: kitCreado, error: errorKit } = await getSupabase()
      .from("kits")
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        tipo_obra: tipoObra,
        estado,
      })
      .select("id")
      .single();

    if (errorKit) {
      setErrorSupabase(errorKit.message);
      setProcesando(false);
      return;
    }

    const kitId = (kitCreado as { id: string }).id;
    const filasProductos = seleccionados.map((sel) => {
      const producto = productos.find((p) => p.id === sel.id);
      return {
        kit_id: kitId,
        producto_id: sel.id,
        tipo: tipoDeProducto(producto),
        cantidad: Number(sel.cantidad),
        unidad: producto?.unidad ?? "unidad",
        observacion: sel.observacion.trim() || null,
      };
    });

    const { error: errorItems } = await getSupabase()
      .from("kit_productos")
      .insert(filasProductos);

    if (errorItems) {
      setErrorSupabase(errorItems.message);
      await getSupabase().from("kits").delete().eq("id", kitId);
      setProcesando(false);
      return;
    }

    router.push("/dashboard/kits");
  };

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Nuevo kit
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Arma un kit de obra seleccionando productos. Se guardará en la base
          de datos.
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
                placeholder="Ej. Falso piso"
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
              placeholder="Describe brevemente el kit..."
              className={`${textareaClasses} ${fieldErrorClasses(!!errores.descripcion)}`}
            />
            {errores.descripcion && (
              <p className={errorClasses}>{errores.descripcion}</p>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Productos del kit
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

            {seleccionados.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Aún no has agregado productos al kit.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {seleccionados.map((sel) => (
                  <li
                    key={sel.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {sel.nombre}
                      </p>
                      <button
                        type="button"
                        onClick={() => quitarProducto(sel.id)}
                        className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`cantidad-${sel.id}`}
                          className={labelClasses}
                        >
                          Cantidad
                        </label>
                        <input
                          id={`cantidad-${sel.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={sel.cantidad}
                          onChange={(e) =>
                            setSeleccionados((actual) =>
                              actual.map((item) =>
                                item.id === sel.id
                                  ? { ...item, cantidad: e.target.value }
                                  : item
                              )
                            )
                          }
                          className={inputClasses}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          htmlFor={`observacion-${sel.id}`}
                          className={labelClasses}
                        >
                          Observación
                        </label>
                        <input
                          id={`observacion-${sel.id}`}
                          type="text"
                          value={sel.observacion}
                          onChange={(e) =>
                            setSeleccionados((actual) =>
                              actual.map((item) =>
                                item.id === sel.id
                                  ? { ...item, observacion: e.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Observación del producto (opcional)"
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {errorKit && (
              <p className={`${errorClasses} mt-3`}>{errorKit}</p>
            )}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {procesando ? "Guardando..." : "Registrar kit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}