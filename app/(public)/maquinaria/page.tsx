"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { getSupabase } from "@/lib/supabase/client";

import {
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";
import {
  calcularDias,
  convertirMaquinaria,
  totalAlquiler,
  type MaquinariaDisponible,
} from "@/lib/rentamicro";

const formatPrecio = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

interface SolicitudConfirmada {
  codigo: string;
  equipoId: string;
  equipoNombre: string;
  cliente: string;
  telefono: string;
  observaciones: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  total: number;
}

export default function MaquinariaPage() {
  const [equipos, setEquipos] = useState<MaquinariaDisponible[]>([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [errorEquipos, setErrorEquipos] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmado, setConfirmado] = useState<SolicitudConfirmada | null>(
    null
  );

  useEffect(() => {
    let activo = true;
    Promise.resolve(
      getSupabase()
        .from("maquinarias")
        .select("id, nombre, descripcion, precio_dia, disponible, imagen")
        .order("nombre", { ascending: true })
    )
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) {
          setErrorEquipos(error.message);
        } else {
          setEquipos(
            ((data ?? []) as unknown as {
              id: string;
              nombre: string;
              descripcion: string | null;
              precio_dia: number;
              disponible: boolean;
              imagen: string | null;
            }[]).map(convertirMaquinaria)
          );
        }
        setCargandoEquipos(false);
      })
      .catch(() => {
        if (activo) setCargandoEquipos(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorEnvio("");
    const datos = new FormData(e.currentTarget);

    const nombre = String(datos.get("nombre") ?? "").trim();
    const telefono = String(datos.get("telefono") ?? "")
      .trim()
      .replace(/[\s-]/g, "");
    const maquinariaId = String(datos.get("maquinaria") ?? "");
    const fechaInicio = String(datos.get("fechaInicio") ?? "");
    const fechaFin = String(datos.get("fechaFin") ?? "");
    const observaciones = String(datos.get("observaciones") ?? "").trim();

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      setErrorEnvio("La fecha fin no puede ser anterior a la fecha inicio.");
      return;
    }

    if (!/^\d{7,15}$/.test(telefono)) {
      setErrorEnvio("Ingresa un teléfono válido (solo dígitos, 7 a 15).");
      return;
    }

    const equipo = equipos.find(
      (item) => item.id === maquinariaId && item.disponible
    );
    if (!equipo) {
      setErrorEnvio("Selecciona una maquinaria disponible.");
      return;
    }

    setEnviando(true);
    const { data: codigo, error } = await getSupabase().rpc(
      "solicitar_alquiler",
      {
        p_nombre: nombre,
        p_telefono: telefono,
        p_maquinaria_id: maquinariaId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
        p_observaciones: observaciones,
      }
    );
    setEnviando(false);

    if (error) {
      setErrorEnvio(
        /PGRST202/i.test(error.message) ||
          error.message.includes("Could not find the function")
          ? "El servidor aún no tiene la función de solicitud. Aplica la migración supabase/rpc-solicitar-alquiler.sql en Supabase."
          : error.message
      );
      return;
    }

    setConfirmado({
      codigo: String(codigo ?? "ALQ-001"),
      equipoId: maquinariaId,
      equipoNombre: equipo.nombre,
      cliente: nombre,
      telefono,
      observaciones,
      fechaInicio,
      fechaFin,
      dias: calcularDias(fechaInicio, fechaFin),
      total: totalAlquiler(equipo.precioDia, fechaInicio, fechaFin),
    });
  };

  const equiposDisponibles = equipos.filter((item) => item.disponible);

  return (
    <div className="flex flex-1 flex-col px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-500">
          WONG · RentaMicro
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Maquinaria
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Equipos disponibles bajo demanda para tu micro-obra, sin inversión
          inicial.
        </p>

        {cargandoEquipos ? (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando maquinaria...
          </div>
        ) : errorEquipos ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudieron cargar los equipos.</p>
            <p className="mt-1">{errorEquipos}</p>
          </div>
        ) : equiposDisponibles.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No hay maquinaria disponible por el momento.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipos.map((equipo) => (
              <article
                key={equipo.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-red-600/50 hover:shadow-lg hover:shadow-red-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-red-500/30"
              >
                <div
                  aria-hidden
                  className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-zinc-100 transition-transform duration-300 group-hover:scale-105 dark:bg-zinc-800"
                >
                  {equipo.imagen ? (
                    <Image
                      src={equipo.imagen}
                      alt={equipo.nombre}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
                      <svg
                        className="h-8 w-8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
                        <path d="M6 12h4" />
                        <circle cx="16" cy="12" r="2" />
                      </svg>
                      <span className="text-xs font-medium">Maquinaria</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-6 text-zinc-900 dark:text-zinc-50">
                      {equipo.nombre}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        equipo.disponible
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {equipo.disponible ? "Disponible" : "No disponible"}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {equipo.descripcion ?? "—"}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Precio por día
                      </p>
                      <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                        {formatPrecio.format(equipo.precioDia)}
                      </p>
                    </div>
                    {equipo.disponible ? (
                      <a
                        href="#solicitar"
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-5 text-sm font-semibold text-white shadow-md shadow-red-600/30 transition-all hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/40"
                      >
                        Solicitar
                      </a>
                    ) : (
                      <span className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 px-5 text-sm font-semibold text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
                        No disponible
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <section id="solicitar" className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Solicitar maquinaria
          </h2>
          <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Completa el formulario y coordinamos la disponibilidad y entrega
            del equipo.
          </p>

          {errorEnvio && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              <p className="font-medium">No se pudo procesar la solicitud.</p>
              <p className="mt-1">{errorEnvio}</p>
            </div>
          )}

          {confirmado ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                Solicitud de alquiler registrada
              </h3>
              <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                Tu solicitud fue registrada con el código{" "}
                <span className="font-semibold">{confirmado.codigo}</span> y
                quedó con estado &quot;solicitado&quot;.{" "}
                {confirmado.observaciones.trim() ? (
                  <span>Incluimos tus observaciones para la coordinación.</span>
                ) : (
                  <span>Coordinaremos la entrega del equipo.</span>
                )}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-emerald-600 dark:text-emerald-400">
                    Cliente
                  </dt>
                  <dd className="font-medium text-emerald-900 dark:text-emerald-100">
                    {confirmado.cliente}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-emerald-600 dark:text-emerald-400">
                    Teléfono
                  </dt>
                  <dd className="font-medium text-emerald-900 dark:text-emerald-100">
                    {confirmado.telefono}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-emerald-600 dark:text-emerald-400">
                    Equipo
                  </dt>
                  <dd className="font-medium text-emerald-900 dark:text-emerald-100">
                    {confirmado.equipoNombre}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-emerald-600 dark:text-emerald-400">
                    Período
                  </dt>
                  <dd className="font-medium text-emerald-900 dark:text-emerald-100">
                    {confirmado.fechaInicio} al {confirmado.fechaFin} (
                    {confirmado.dias} día{confirmado.dias === 1 ? "" : "s"})
                  </dd>
                </div>
                {confirmado.observaciones.trim() && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-emerald-600 dark:text-emerald-400">
                      Observaciones
                    </dt>
                    <dd className="font-medium text-emerald-900 dark:text-emerald-100">
                      {confirmado.observaciones}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-emerald-600 dark:text-emerald-400">
                    Total estimado
                  </dt>
                  <dd className="font-medium text-emerald-900 dark:text-emerald-100">
                    {formatPrecio.format(confirmado.total)}
                  </dd>
                </div>
              </dl>
              <a
                href={enlaceWhatsapp(
                  [
                    "Hola, quiero solicitar el alquiler de maquinaria:",
                    "",
                    `Cliente: ${confirmado.cliente}`,
                    `Teléfono: ${confirmado.telefono}`,
                    `Equipo: ${confirmado.equipoNombre}`,
                    `Período: ${confirmado.fechaInicio} al ${confirmado.fechaFin} (${confirmado.dias} día${confirmado.dias === 1 ? "" : "s"})`,
                    `Total estimado: S/ ${confirmado.total.toFixed(2)}`,
                    ...(confirmado.observaciones.trim()
                      ? ["", `Observaciones: ${confirmado.observaciones}`]
                      : []),
                    "",
                    `Código: ${confirmado.codigo}`,
                  ].join("\n")
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-8 text-base font-semibold text-white shadow-md shadow-emerald-500/30 transition-all hover:bg-[#1ebe5b] hover:shadow-lg hover:shadow-emerald-500/40"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Enviar por WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setConfirmado(null)}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl border border-emerald-300 px-8 text-base font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 sm:w-auto dark:border-emerald-500/50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              >
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => void enviar(e)}
              className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="maquinaria" className={labelClasses}>
                    Maquinaria
                  </label>
                  <select
                    id="maquinaria"
                    name="maquinaria"
                    required
                    defaultValue={equiposDisponibles[0]?.id ?? ""}
                    className={inputClasses}
                  >
                    {equiposDisponibles.length === 0 ? (
                      <option value="" disabled>
                        No hay equipos disponibles
                      </option>
                    ) : (
                      equiposDisponibles.map((equipo) => (
                        <option
                          key={equipo.id}
                          value={equipo.id}
                          disabled={!equipo.disponible}
                        >
                          {equipo.nombre}
                          {equipo.disponible ? "" : " (no disponible)"}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label htmlFor="nombre" className={labelClasses}>
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="telefono" className={labelClasses}>
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
                    placeholder="Ej. 987 654 321"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="fechaInicio" className={labelClasses}>
                    Fecha inicio
                  </label>
                  <input
                    id="fechaInicio"
                    name="fechaInicio"
                    type="date"
                    required
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="fechaFin" className={labelClasses}>
                    Fecha fin
                  </label>
                  <input
                    id="fechaFin"
                    name="fechaFin"
                    type="date"
                    required
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="observaciones" className={labelClasses}>
                  Observaciones
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  rows={3}
                  placeholder="Indicaciones adicionales (opcional), por ejemplo lugar de entrega, acceso a obra, etc."
                  className={textareaClasses}
                />
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 text-base font-semibold text-white shadow-md shadow-red-600/30 transition-all hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {enviando ? "Enviando..." : "Solicitar alquiler"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}