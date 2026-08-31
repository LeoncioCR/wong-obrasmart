"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { errorClasses, inputClasses, labelClasses } from "@/lib/formClasses";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
}

const estadoBadge = {
  activo: {
    label: "Activo",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  inactivo: {
    label: "Inactivo",
    classes: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
} as const;

const fetchCategorias = () =>
  getSupabase()
    .from("categorias")
    .select("id, nombre, descripcion, estado")
    .order("nombre", { ascending: true });

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<Categoria["estado"]>("activo");
  const [errorNombre, setErrorNombre] = useState("");
  const [errorDescripcion, setErrorDescripcion] = useState("");

  const cargarCategorias = async () => {
    setCargando(true);
    setErrorSupabase("");
    const { data, error } = await fetchCategorias();

    if (error) {
      setErrorSupabase(error.message);
      setCategorias([]);
    } else {
      setCategorias((data ?? []) as Categoria[]);
    }
    setCargando(false);
  };

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchCategorias())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setCategorias([]);
        } else {
          setCategorias((data ?? []) as Categoria[]);
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

  const abrirNuevo = () => {
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setEstado("activo");
    setErrorNombre("");
    setErrorDescripcion("");
    setMostrandoFormulario(true);
  };

  const cancelar = () => {
    setMostrandoFormulario(false);
    setEditandoId(null);
    setNombre("");
    setDescripcion("");
    setEstado("activo");
    setErrorNombre("");
    setErrorDescripcion("");
  };

  const iniciarEdicion = (cat: Categoria) => {
    setEditandoId(cat.id);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion ?? "");
    setEstado(cat.estado);
    setErrorNombre("");
    setErrorDescripcion("");
    setMostrandoFormulario(true);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrorNombre = nombre.trim()
      ? ""
      : "Ingresa el nombre de la categoría.";
    const nextErrorDescripcion = descripcion.trim()
      ? ""
      : "Ingresa una descripción breve.";
    setErrorNombre(nextErrorNombre);
    setErrorDescripcion(nextErrorDescripcion);
    if (nextErrorNombre || nextErrorDescripcion) return;

    setProcesando(true);
    setErrorSupabase("");

    const datosFormulario = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      estado,
    };

    if (editandoId) {
      const { error } = await getSupabase()
        .from("categorias")
        .update(datosFormulario)
        .eq("id", editandoId);
      if (error) {
        setErrorSupabase(error.message);
        setProcesando(false);
        return;
      }
    } else {
      const { error } = await getSupabase()
        .from("categorias")
        .insert(datosFormulario);
      if (error) {
        setErrorSupabase(error.message);
        setProcesando(false);
        return;
      }
    }

    setProcesando(false);
    cancelar();
    cargarCategorias();
  };

  const cambiarEstado = async (cat: Categoria) => {
    setProcesando(true);
    setErrorSupabase("");

    const { error } = await getSupabase()
      .from("categorias")
      .update({ estado: cat.estado === "activo" ? "inactivo" : "activo" })
      .eq("id", cat.id);
    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      return;
    }

    setProcesando(false);
    cargarCategorias();
  };

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Categorías
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando categorías..."
                : `${categorias.length} categorías registradas.`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => (mostrandoFormulario ? cancelar() : abrirNuevo())}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700"
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
            {mostrandoFormulario ? "Cancelar" : "Nueva categoría"}
          </button>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo completar la operación.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {mostrandoFormulario && (
          <form
            onSubmit={enviar}
            className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="cat-nombre" className={labelClasses}>
                  Nombre
                </label>
                <input
                  id="cat-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrorNombre("");
                  }}
                  placeholder="Ej. Materiales"
                  className={`${inputClasses} ${
                    errorNombre ? "border-red-500" : ""
                  }`}
                />
                {errorNombre && <p className={errorClasses}>{errorNombre}</p>}
              </div>
              <div>
                <label htmlFor="cat-descripcion" className={labelClasses}>
                  Descripción
                </label>
                <input
                  id="cat-descripcion"
                  type="text"
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    setErrorDescripcion("");
                  }}
                  placeholder="Breve descripción"
                  className={`${inputClasses} ${
                    errorDescripcion ? "border-red-500" : ""
                  }`}
                />
                {errorDescripcion && (
                  <p className={errorClasses}>{errorDescripcion}</p>
                )}
              </div>
              <div>
                <label htmlFor="cat-estado" className={labelClasses}>
                  Estado
                </label>
                <select
                  id="cat-estado"
                  value={estado}
                  onChange={(e) =>
                    setEstado(e.target.value as Categoria["estado"])
                  }
                  className={inputClasses}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={procesando}
                className="inline-flex h-11 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editandoId ? "Guardar cambios" : "Agregar categoría"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                    Nombre
                  </th>
                  <th className="px-5 py-3 font-medium">Descripción</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => {
                  const badge = estadoBadge[cat.estado] ?? {
                    label: "Desconocido",
                    classes:
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                  };
                  return (
                    <tr
                      key={cat.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                        {cat.nombre}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {cat.descripcion}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(cat)}
                          disabled={procesando}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => cambiarEstado(cat)}
                          disabled={procesando}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          {cat.estado === "activo" ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {!cargando && categorias.length === 0 && !errorSupabase && (
          <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
            No hay categorías registradas.
          </p>
        )}
      </div>
    </div>
  );
}