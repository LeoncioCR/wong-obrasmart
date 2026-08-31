"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";

import {
  errorClasses,
  fieldErrorClasses,
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  cotizaciones: number;
  created_at: string;
}

interface FilaCliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  created_at: string;
  cotizaciones: { count: number }[];
}

interface FormState {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  nombre: "",
  telefono: "",
  email: "",
  direccion: "",
};

const emptyErrors: FormErrors = {};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const fetchClientes = () =>
  getSupabase()
    .from("clientes")
    .select(
      "id, nombre, telefono, email, direccion, created_at, cotizaciones(count)"
    )
    .order("nombre", { ascending: true });

const convertirFila = (fila: FilaCliente): Cliente => ({
  id: fila.id,
  nombre: fila.nombre,
  telefono: fila.telefono,
  email: fila.email,
  direccion: fila.direccion,
  created_at: fila.created_at,
  cotizaciones: fila.cotizaciones?.[0]?.count ?? 0,
});

const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function ClientesPage() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [modalForm, setModalForm] = useState<"nuevo" | "editar" | null>(null);
const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
const [eliminandoId, setEliminandoId] = useState<string | null>(null);
const [errorEliminar, setErrorEliminar] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchClientes())
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorSupabase(error.message);
          setItems([]);
        } else {
          setItems(
            ((data ?? []) as unknown as FilaCliente[]).map(convertirFila)
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

  const filtrados = useMemo(() => {
    const termino = normalize(busqueda).trim();
    if (!termino) return items;
    return items.filter((cliente) =>
      [cliente.nombre, cliente.email ?? "", cliente.telefono, cliente.direccion ?? ""]
        .map(normalize)
        .some((campo) => campo.includes(termino))
    );
  }, [busqueda, items]);

  const cargarClientes = async () => {
    const { data, error } = await fetchClientes();
    if (error) {
      setErrorSupabase(error.message);
      setItems([]);
      return;
    }
    setItems(((data ?? []) as unknown as FilaCliente[]).map(convertirFila));
  };

  const abrirNuevo = () => {
    setForm(initialForm);
    setErrors(emptyErrors);
    setErrorSupabase("");
    setModalForm("nuevo");
  };

  const abrirEditar = (cliente: Cliente) => {
    setClienteEditar(cliente);
    setForm({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email ?? "",
      direccion: cliente.direccion ?? "",
    });
    setErrors(emptyErrors);
    setErrorSupabase("");
    setModalForm("editar");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!form.nombre.trim()) {
      nextErrors.nombre = "Ingresa el nombre del cliente.";
    }

    if (!form.telefono.trim()) {
      nextErrors.telefono = "Ingresa el teléfono del cliente.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Ingresa un correo válido.";
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
      telefono: form.telefono.trim(),
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
    };

    const { error } =
      modalForm === "nuevo"
        ? await getSupabase().from("clientes").insert(payload)
        : await getSupabase()
            .from("clientes")
            .update(payload)
            .eq("id", clienteEditar?.id ?? "");

    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      return;
    }

    setProcesando(false);
    setModalForm(null);
    setClienteEditar(null);
    await cargarClientes();
  };

  const eliminar = async (cliente: Cliente) => {
    if (eliminandoId) return;
    if (!window.confirm(`¿Eliminar al cliente "${cliente.nombre}"?`)) return;
    setEliminandoId(cliente.id);
    setErrorEliminar("");
    const supabase = getSupabase();
    const [cotizaciones, pedidos, alquileres] = await Promise.all([
      supabase
        .from("cotizaciones")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", cliente.id),
      supabase
        .from("pedidos")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", cliente.id),
      supabase
        .from("alquileres")
        .select("id", { count: "exact", head: true })
        .eq("cliente_id", cliente.id),
    ]);
    const relError =
      cotizaciones.error?.message ??
      pedidos.error?.message ??
      alquileres.error?.message ??
      "";
    if (relError) {
      setErrorEliminar(relError);
      setEliminandoId(null);
      return;
    }
    const nCot = cotizaciones.count ?? 0;
    const nPed = pedidos.count ?? 0;
    const nAlq = alquileres.count ?? 0;
    const totalRel = nCot + nPed + nAlq;
    if (totalRel > 0) {
      setErrorEliminar(
        `No se puede eliminar: el cliente tiene ${totalRel} operación(es) relacionada(s) (${nCot} cotizaciones, ${nPed} pedidos, ${nAlq} alquileres).`
      );
      setEliminandoId(null);
      return;
    }
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", cliente.id);
    if (error) {
      setErrorEliminar(error.message);
      setEliminandoId(null);
      return;
    }
    setEliminandoId(null);
    await cargarClientes();
  };

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Clientes
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {cargando
                ? "Cargando clientes..."
                : errorSupabase
                  ? "No se pudieron cargar los clientes."
                  : `${filtrados.length} de ${items.length} clientes.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block lg:w-80">
              <span className="sr-only">Buscar cliente</span>
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono..."
                className="h-12 w-full rounded-full border border-zinc-300 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
            <button
              type="button"
              onClick={abrirNuevo}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-red-700"
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
              Nuevo cliente
            </button>
          </div>
        </div>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudieron cargar los clientes.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        {errorEliminar && (
          <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">{errorEliminar}</p>
            <button
              type="button"
              onClick={() => setErrorEliminar("")}
              className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-100 dark:border-red-500/50 dark:hover:bg-red-500/10"
            >
              Cerrar
            </button>
          </div>
        )}

        {cargando ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando clientes...
          </div>
        ) : items.length === 0 && !errorSupabase ? (
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay clientes registrados.
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <th className="sticky left-0 z-10 px-5 py-3 font-medium">
                      Nombre
                    </th>
                    <th className="px-5 py-3 font-medium">Teléfono</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Dirección</th>
                    <th className="px-5 py-3 font-medium">Registrado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60"
                    >
                      <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                        {cliente.nombre}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {cliente.telefono}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {cliente.email ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {cliente.direccion ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                        {formatearFecha(cliente.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/clientes/${cliente.id}`}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Ver detalle
                          </Link>
                          <button
                            type="button"
                            onClick={() => abrirEditar(cliente)}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void eliminar(cliente)}
                            disabled={eliminandoId !== null}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            {eliminandoId === cliente.id
                              ? "Eliminando..."
                              : "Eliminar"}
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

        {!cargando && !errorSupabase && filtrados.length === 0 && (
          <p className="mt-10 text-center text-zinc-500 dark:text-zinc-400">
            No se encontraron clientes para &quot;{busqueda}&quot;.
          </p>
        )}

        {modalForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cliente-form-titulo"
          >
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <h2
                id="cliente-form-titulo"
                className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
              >
                {modalForm === "nuevo" ? "Nuevo cliente" : "Editar cliente"}
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
                  guardar();
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
                    placeholder="Ej. María Fernanda López"
                    className={`${inputClasses} ${fieldErrorClasses(!!errors.nombre)}`}
                  />
                  {errors.nombre && (
                    <p className={errorClasses}>{errors.nombre}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="telefono" className={labelClasses}>
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="Ej. 987 654 321"
                      className={`${inputClasses} ${fieldErrorClasses(!!errors.telefono)}`}
                    />
                    {errors.telefono && (
                      <p className={errorClasses}>{errors.telefono}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClasses}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="opcional"
                      className={`${inputClasses} ${fieldErrorClasses(!!errors.email)}`}
                    />
                    {errors.email && (
                      <p className={errorClasses}>{errors.email}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="direccion" className={labelClasses}>
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    rows={2}
                    value={form.direccion}
                    onChange={handleChange}
                    placeholder="opcional"
                    className={textareaClasses}
                  />
                </div>

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
                        ? "Crear cliente"
                        : "Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}