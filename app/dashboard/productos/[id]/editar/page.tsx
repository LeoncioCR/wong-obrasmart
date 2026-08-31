"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

import {
  errorClasses,
  fieldErrorClasses,
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";

interface CategoriaOpcion {
  id: string;
  nombre: string;
}

interface ProductoEditar {
  id: string;
  nombre: string;
  categoria_id: string;
  descripcion: string | null;
  precio: number;
  unidad: string;
  stock: number;
  estado: "disponible" | "bajo stock" | "agotado";
  imagen: string | null;
}

const opcionesEstado: { value: string; label: string }[] = [
  { value: "disponible", label: "Disponible" },
  { value: "bajo stock", label: "Bajo stock" },
  { value: "agotado", label: "Agotado" },
];

interface FormState {
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: string;
  stock: string;
  unidad: string;
  estado: string;
  imagen: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Cargando producto...
          </p>
        </div>
      }
    >
      <ProductoEditar params={params} />
    </Suspense>
  );
}

function ProductoEditar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ProductoForm id={id} />;
}

function ProductoForm({ id }: { id: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [categorias, setCategorias] = useState<CategoriaOpcion[]>([]);
  const [errorCategorias, setErrorCategorias] = useState("");
  const [errorSupabase, setErrorSupabase] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [form, setForm] = useState<FormState>({
    nombre: "",
    categoria: "",
    descripcion: "",
    precio: "",
    stock: "",
    unidad: "",
    estado: "",
    imagen: "",
  });
  const [productoNombre, setProductoNombre] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let activo = true;

    Promise.resolve(
      getSupabase()
        .from("productos")
        .select(
          "id, nombre, categoria_id, descripcion, precio, unidad, stock, estado, imagen"
        )
        .eq("id", id)
        .maybeSingle()
    )
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
        const producto = data as unknown as ProductoEditar;
        setProductoNombre(producto.nombre);
        setForm({
          nombre: producto.nombre,
          categoria: producto.categoria_id,
          descripcion: producto.descripcion ?? "",
          precio: String(producto.precio),
          stock: String(producto.stock),
          unidad: producto.unidad,
          estado: producto.estado,
          imagen: producto.imagen ?? "",
        });
        setCargando(false);
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo cargar el producto.");
          setCargando(false);
        }
      });

    Promise.resolve(
      getSupabase()
        .from("categorias")
        .select("id, nombre")
        .order("nombre", { ascending: true })
    )
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorCategorias(error.message);
        } else {
          setCategorias((data ?? []) as unknown as CategoriaOpcion[]);
        }
      })
      .catch(() => {
        if (activo) {
          setErrorCategorias("No se pudieron cargar las categorías.");
        }
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.nombre.trim()) {
      nextErrors.nombre = "Ingresa el nombre del producto.";
    }

    if (!form.categoria) {
      nextErrors.categoria = "Selecciona una categoría.";
    }

    const precio = Number(form.precio);
    if (!form.precio || Number.isNaN(precio) || precio <= 0) {
      nextErrors.precio = "Ingresa un precio mayor a 0.";
    }

    const stock = Number(form.stock);
    if (
      form.stock === "" ||
      Number.isNaN(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      nextErrors.stock = "Ingresa un stock entero mayor o igual a 0.";
    }

    if (!form.unidad.trim()) {
      nextErrors.unidad = "Ingresa la unidad de medida.";
    }

    if (!form.estado) {
      nextErrors.estado = "Selecciona un estado.";
    }

    return nextErrors;
  };

  const guardar = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((err) => err)) return;

    setProcesando(true);
    setErrorSupabase("");

    const { error } = await getSupabase()
      .from("productos")
      .update({
        nombre: form.nombre.trim(),
        categoria_id: form.categoria,
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        unidad: form.unidad.trim(),
        stock: Number(form.stock),
        estado: form.estado,
        imagen: form.imagen.trim() || null,
      })
      .eq("id", id);

    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      return;
    }

    router.push("/dashboard/productos");
  };

  if (cargando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Cargando producto...
        </p>
      </div>
    );
  }

  if (noEncontrado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Producto no encontrado
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          No existe un producto con el id &quot;{id}&quot;.
        </p>
        <Link
          href="/dashboard/productos"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Volver a productos
        </Link>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          No se pudo cargar el producto
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {errorCarga}
        </p>
        <Link
          href="/dashboard/productos"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
        >
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/dashboard/productos"
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
          Volver a productos
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Editar producto
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Edita los datos de {productoNombre}. Los cambios se guardarán en la
          base de datos.
        </p>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo guardar el producto.</p>
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
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.nombre)}`}
              />
              {errors.nombre && <p className={errorClasses}>{errors.nombre}</p>}
            </div>
            <div>
              <label htmlFor="categoria" className={labelClasses}>
                Categoría
              </label>
              <select
                id="categoria"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.categoria)}`}
              >
                <option value="" disabled>
                  {categorias.length === 0
                    ? "Cargando categorías..."
                    : "Selecciona una categoría"}
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <p className={errorClasses}>{errors.categoria}</p>
              )}
              {errorCategorias && (
                <p className={errorClasses}>{errorCategorias}</p>
              )}
            </div>
            <div>
              <label htmlFor="precio" className={labelClasses}>
                Precio (S/)
              </label>
              <input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.precio)}`}
              />
              {errors.precio && (
                <p className={errorClasses}>{errors.precio}</p>
              )}
            </div>
            <div>
              <label htmlFor="stock" className={labelClasses}>
                Stock
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.stock)}`}
              />
              {errors.stock && <p className={errorClasses}>{errors.stock}</p>}
            </div>
            <div>
              <label htmlFor="unidad" className={labelClasses}>
                Unidad
              </label>
              <input
                id="unidad"
                name="unidad"
                type="text"
                value={form.unidad}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.unidad)}`}
              />
              {errors.unidad && <p className={errorClasses}>{errors.unidad}</p>}
            </div>
            <div>
              <label htmlFor="estado" className={labelClasses}>
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.estado)}`}
              >
                <option value="" disabled>
                  Selecciona un estado
                </option>
                {opcionesEstado.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
              {errors.estado && (
                <p className={errorClasses}>{errors.estado}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="descripcion" className={labelClasses}>
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              value={form.descripcion}
              onChange={handleChange}
              className={`${textareaClasses} ${fieldErrorClasses(!!errors.descripcion)}`}
            />
            {errors.descripcion && (
              <p className={errorClasses}>{errors.descripcion}</p>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="imagen" className={labelClasses}>
              URL de imagen{" "}
              <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              id="imagen"
              name="imagen"
              type="text"
              value={form.imagen}
              onChange={handleChange}
              placeholder="Ej. https://images.unsplash.com/photo-... o https://tu-proyecto.supabase.co/storage/v1/object/public/..."
              className={`${inputClasses} ${fieldErrorClasses(!!errors.imagen)}`}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Usa una URL completa https://... para que la imagen se muestre en
              el catálogo.
            </p>
            {errors.imagen && <p className={errorClasses}>{errors.imagen}</p>}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {procesando ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link
              href="/dashboard/productos"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}