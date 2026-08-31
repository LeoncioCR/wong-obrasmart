"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase/client";

import {
  errorClasses,
  fieldErrorClasses,
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";

interface Maquinaria {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioDia: number;
  disponible: boolean;
  imagen: string | null;
}

interface FilaMaquinaria {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_dia: number;
  disponible: boolean;
  imagen: string | null;
}

interface FormState {
  nombre: string;
  descripcion: string;
  precioDia: string;
  disponible: boolean;
  imagen: string;
}

type FormErrors = Partial<Record<"nombre" | "precioDia", string>>;

const initialForm: FormState = {
  nombre: "",
  descripcion: "",
  precioDia: "",
  disponible: true,
  imagen: "",
};

const emptyErrors: FormErrors = {};

const estadoPorDisponibilidad = (disponible: boolean) =>
  disponible ? "Activo" : "En mantenimiento";

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const fetchMaquinarias = () =>
  getSupabase()
    .from("maquinarias")
    .select("id, nombre, descripcion, precio_dia, disponible, imagen")
    .order("nombre", { ascending: true });

const convertirFila = (fila: FilaMaquinaria): Maquinaria => ({
  id: fila.id,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  precioDia: fila.precio_dia,
  disponible: fila.disponible,
  imagen: fila.imagen,
});

export default function MaquinariaAdminPage() {
  const [items, setItems] = useState<Maquinaria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [modalForm, setModalForm] = useState<"nuevo" | "editar" | null>(null);
  const [maquinaEditar, setMaquinaEditar] = useState<Maquinaria | null>(null);
  const [eliminarItem, setEliminarItem] = useState<Maquinaria | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [procesando, setProcesando] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchMaquinarias())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          setItems(
            ((data ?? []) as unknown as FilaMaquinaria[]).map(convertirFila)
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

  const cargarMaquinarias = async () => {
    const { data, error } = await fetchMaquinarias();
    if (error) {
      setErrorSupabase(error.message);
      setItems([]);
      return;
    }
    setItems(((data ?? []) as unknown as FilaMaquinaria[]).map(convertirFila));
  };

  const abrirNuevo = () => {
    setForm(initialForm);
    setErrors(emptyErrors);
    setErrorSupabase("");
    setModalForm("nuevo");
  };

  const abrirEditar = (item: Maquinaria) => {
    setMaquinaEditar(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion ?? "",
      precioDia: String(item.precioDia),
      disponible: item.disponible,
      imagen: item.imagen ?? "",
    });
    setErrors(emptyErrors);
    setErrorSupabase("");
    setModalForm("editar");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.nombre.trim()) {
      nextErrors.nombre = "Ingresa el nombre de la máquina.";
    }

    const precio = Number(form.precioDia);
    if (!form.precioDia.trim() || Number.isNaN(precio) || precio < 0) {
      nextErrors.precioDia = "Ingresa un precio por día válido.";
    }

    return nextErrors;
  };

  const guardar = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((err) => err)) return;

    setProcesando(true);
    setErrorSupabase("");

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      precio_dia: Number(form.precioDia),
      disponible: form.disponible,
      imagen: form.imagen.trim() || null,
    };

    const { error } =
      modalForm === "nuevo"
        ? await getSupabase().from("maquinarias").insert(payload)
        : await getSupabase()
            .from("maquinarias")
            .update(payload)
            .eq("id", maquinaEditar?.id ?? "");

    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      return;
    }

    setProcesando(false);
    setModalForm(null);
    setMaquinaEditar(null);
    await cargarMaquinarias();
  };

  const cambiarDisponibilidad = async (item: Maquinaria) => {
    if (togglingId) return;
    setTogglingId(item.id);
    setErrorSupabase("");
    const nuevo = !item.disponible;
    const { error } = await getSupabase()
      .from("maquinarias")
      .update({ disponible: nuevo })
      .eq("id", item.id);
    if (error) {
      setErrorSupabase(error.message);
      setTogglingId(null);
      return;
    }
    setItems((actual) =>
      actual.map((i) =>
        i.id === item.id ? { ...i, disponible: nuevo } : i
      )
    );
    setTogglingId(null);
  };

  const confirmarEliminar = async () => {
    if (!eliminarItem) return;
    setProcesando(true);
    setErrorSupabase("");
    const { error } = await getSupabase()
      .from("maquinarias")
      .delete()
      .eq("id", eliminarItem.id);
    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      setEliminarItem(null);
      return;
    }
    setProcesando(false);
    setEliminarItem(null);
    await cargarMaquinarias();
  };

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Maquinaria
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando máquinas..."
                : errorSupabase
                  ? "No se pudieron cargar las máquinas."
                  : `${items.length} equipos registrados.`}
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
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
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Nueva máquina
          </button>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">
              {eliminarItem
                ? "No se pudo eliminar la máquina."
                : "No se pudieron cargar las máquinas."}
            </p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando máquinas...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay máquinas registradas.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Nombre
                    </th>
                    <th className="px-5 py-3 font-medium">Precio por día</th>
                    <th className="px-5 py-3 font-medium">Disponibilidad</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="sticky left-0 bg-white px-5 py-3.5 dark:bg-zinc-900">
                        <div className="flex items-center gap-3">
                          {item.imagen ? (
                            <Image
                              src={item.imagen}
                              alt={item.nombre}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                            >
                              {item.nombre.slice(0, 1)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 dark:text-zinc-50">
                              {item.nombre}
                            </p>
                            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {item.descripcion ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">
                        {formatPrecio.format(item.precioDia)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => cambiarDisponibilidad(item)}
                          disabled={togglingId !== null}
                          title="Haz clic para cambiar la disponibilidad"
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            item.disponible
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                          }`}
                        >
                          {item.disponible ? "Disponible" : "No disponible"}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.disponible
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          }`}
                        >
                          {estadoPorDisponibilidad(item.disponible)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => abrirEditar(item)}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorSupabase("");
                              setEliminarItem(item);
                            }}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white dark:border-zinc-700 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                          >
                            Eliminar
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

        {modalForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="maquina-form-titulo"
          >
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h2
                id="maquina-form-titulo"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              >
                {modalForm === "nuevo" ? "Nueva máquina" : "Editar máquina"}
              </h2>

              {errorSupabase && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {errorSupabase}
                </p>
              )}

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void guardar();
                }}
                className="mt-4 space-y-4"
              >
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
                    placeholder="Ej. Mezcladora de concreto"
                    className={`${inputClasses} ${fieldErrorClasses(!!errors.nombre)}`}
                  />
                  {errors.nombre && (
                    <p className={errorClasses}>{errors.nombre}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="descripcion" className={labelClasses}>
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={3}
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="opcional"
                    className={textareaClasses}
                  />
                </div>
                <div>
                  <label htmlFor="imagen" className={labelClasses}>
                    URL de imagen <span className="text-zinc-400">opcional</span>
                  </label>
                  <input
                    id="imagen"
                    name="imagen"
                    type="text"
                    value={form.imagen}
                    onChange={handleChange}
                    placeholder="Ej. /maquinaria/mezcladora.png o https://..."
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="precioDia" className={labelClasses}>
                    Precio por día (S/)
                  </label>
                  <input
                    id="precioDia"
                    name="precioDia"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.precioDia}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`${inputClasses} ${fieldErrorClasses(!!errors.precioDia)}`}
                  />
                  {errors.precioDia && (
                    <p className={errorClasses}>{errors.precioDia}</p>
                  )}
                </div>
                <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    name="disponible"
                    checked={form.disponible}
                    onChange={handleChange}
                    className="h-4 w-4 accent-red-600"
                  />
                  Disponible para alquiler
                </label>

                <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setModalForm(null)}
                    disabled={procesando}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {procesando
                      ? "Guardando..."
                      : modalForm === "nuevo"
                        ? "Crear máquina"
                        : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {eliminarItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="maquina-eliminar-titulo"
          >
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h2
                id="maquina-eliminar-titulo"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              >
                Eliminar máquina
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                ¿Seguro que deseas eliminar &quot;{eliminarItem.nombre}&quot;?
                Esta acción no se puede deshacer.
              </p>
              <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEliminarItem(null)}
                  disabled={procesando}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarEliminar()}
                  disabled={procesando}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {procesando ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}