"use client";

import { useEffect, useState } from "react";
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
}

const initialForm: FormState = {
  nombre: "",
  categoria: "",
  descripcion: "",
  precio: "",
  stock: "",
  unidad: "",
  estado: "",
};

export default function NuevoProductoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [categorias, setCategorias] = useState<CategoriaOpcion[]>([]);
  const [errorCategorias, setErrorCategorias] = useState("");
  const [errorSupabase, setErrorSupabase] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let activo = true;
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
        if (activo) setErrorCategorias("No se pudieron cargar las categorías.");
      });
    return () => {
      activo = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

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
      .insert({
        categoria_id: form.categoria,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        unidad: form.unidad.trim(),
        stock: Number(form.stock),
        estado: form.estado,
      });

    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      return;
    }

    router.push("/dashboard/productos");
  };

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
          Nuevo producto
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Ingresa los datos del producto. Se guardará en la base de datos.
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
                placeholder="Ej. Cemento Portland Tipo I"
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
                placeholder="Ej. 32.50"
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
                placeholder="Ej. 120"
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
                placeholder="Ej. bolsa, m3, unidad, día"
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
              placeholder="Describe brevemente el producto (opcional)..."
              className={`${textareaClasses} ${fieldErrorClasses(!!errors.descripcion)}`}
            />
            {errors.descripcion && (
              <p className={errorClasses}>{errors.descripcion}</p>
            )}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {procesando ? "Guardando..." : "Registrar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}