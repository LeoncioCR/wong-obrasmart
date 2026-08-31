"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { enlaceWhatsapp } from "@/lib/whatsapp";

import {
  errorClasses,
  fieldErrorClasses,
  inputClasses,
  labelClasses,
  textareaClasses,
} from "@/lib/formClasses";

const tiposObraPorDefecto = [
  "Nivelación y base de pisos",
  "Acabado de muros y superficies",
  "Construcción de muros",
  "Veredas y sardineles",
  "Remodelación y mantenimiento",
];

interface KitOpcion {
  id: string;
  nombre: string;
}

interface ItemKit {
  nombre: string;
  cantidad: number;
  unidad: string;
}

interface ResumenKit {
  nombre: string;
  precioReferencial: number;
  items: ItemKit[];
}

interface FormState {
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  tipoObra: string;
  kit: string;
  descripcion: string;
  observaciones: string;
}

const initialForm: FormState = {
  nombres: "",
  apellidos: "",
  telefono: "",
  email: "",
  tipoObra: "",
  kit: "",
  descripcion: "",
  observaciones: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fetchKits = () =>
  getSupabase()
    .from("kits")
    .select("id, nombre, tipo_obra")
    .order("nombre", { ascending: true });

export default function CotizarPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [kits, setKits] = useState<KitOpcion[]>([]);
  const [tiposDeObra, setTiposDeObra] = useState<string[]>(tiposObraPorDefecto);
  const [procesando, setProcesando] = useState(false);
  const [errorSupabase, setErrorSupabase] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [resumenKit, setResumenKit] = useState<ResumenKit | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.resolve(fetchKits())
      .then(({ data, error }) => {
        if (!activo) return;
        if (!error) {
          const filas = data ?? [];
          setKits(filas as unknown as KitOpcion[]);
          const tipos = [
            ...new Set(
              (filas as unknown as { tipo_obra: string }[])
                .map((k) => k.tipo_obra)
                .filter(Boolean)
            ),
          ];
          if (tipos.length > 0) setTiposDeObra([...tipos, "Otro"]);
        }
      })
      .catch(() => {
        if (activo) setTiposDeObra(tiposObraPorDefecto);
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

    if (!form.nombres.trim()) {
      nextErrors.nombres = "Ingresa tus nombres.";
    }

    const telefonoDigitos = form.telefono.replace(/\D/g, "");
    if (!telefonoDigitos) {
      nextErrors.telefono = "Ingresa tu teléfono.";
    } else if (telefonoDigitos.length < 9 || telefonoDigitos.length > 12) {
      nextErrors.telefono = "El teléfono debe tener entre 9 y 12 dígitos.";
    }

    if (form.email && !emailRegex.test(form.email)) {
      nextErrors.email = "Ingresa un email válido.";
    }

    if (!form.tipoObra) {
      nextErrors.tipoObra = "Selecciona un tipo de obra.";
    }

    if (!form.descripcion.trim()) {
      nextErrors.descripcion = "Describe brevemente tu obra.";
    }

    return nextErrors;
  };

  const cargarResumenKit = async (kitId: string) => {
    setCargandoResumen(true);
    const { data, error } = await getSupabase()
      .from("kits")
      .select(
        "id, nombre, precio_referencial, kit_productos(productos(nombre), cantidad, unidad)"
      )
      .eq("id", kitId)
      .single();

    if (!error && data) {
      const raw = data as unknown as {
        nombre: string;
        precio_referencial: number;
        kit_productos: {
          cantidad: number;
          unidad: string;
          productos: { nombre: string } | null;
        }[];
      };
      const items = (raw.kit_productos ?? []).map((kp) => ({
        nombre: kp.productos?.nombre ?? "Material",
        cantidad: kp.cantidad,
        unidad: kp.unidad,
      }));
      setResumenKit({
        nombre: raw.nombre,
        precioReferencial: Number(raw.precio_referencial ?? 0),
        items,
      });
    }
    setCargandoResumen(false);
  };

  const enviar = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((err) => err)) return;

    setProcesando(true);
    setErrorSupabase("");

    const { data, error } = await getSupabase().rpc("enviar_cotizacion", {
      p_nombres: form.nombres.trim(),
      p_apellidos: form.apellidos.trim(),
      p_telefono: form.telefono.trim(),
      p_email: form.email.trim(),
      p_tipo_obra: form.tipoObra,
      p_kit_id: form.kit || null,
      p_descripcion: form.descripcion.trim(),
      p_observaciones: form.observaciones.trim(),
    });

    if (error) {
      setErrorSupabase(error.message);
      setProcesando(false);
      return;
    }

    setCodigo((data as string) ?? "");
    setProcesando(false);
    setEnviado(true);
    if (form.kit) {
      void cargarResumenKit(form.kit);
    }
  };

  if (enviado) {
    const cliente = [form.nombres, form.apellidos]
      .filter(Boolean)
      .join(" ")
      .trim();
    const preparandoMensaje = form.kit && cargandoResumen && !resumenKit;
    const partesMensaje = [
      "Hola, quiero solicitar una cotización para mi obra:",
      "",
      `Cliente: ${cliente || "—"}`,
      `Tipo de obra: ${form.tipoObra}`,
      `Kit: ${resumenKit ? resumenKit.nombre : "Ninguno"}`,
    ];
    if (resumenKit) {
      partesMensaje.push("", "Materiales:");
      resumenKit.items.forEach((item) =>
        partesMensaje.push(`• ${item.nombre}: ${item.cantidad} ${item.unidad}`)
      );
      partesMensaje.push(
        "",
        `Precio referencial: S/ ${resumenKit.precioReferencial.toFixed(2)}`
      );
    }
    partesMensaje.push(
      "",
      `Descripción: ${form.descripcion}`,
      "",
      `Código: ${codigo || "en trámite"}`
    );
    const mensajeWhatsapp = partesMensaje.join("\n");

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Solicitud de cotización registrada correctamente.
          </h1>
          {codigo && (
            <p className="mt-4 inline-flex items-center rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
              Código: {codigo}
            </p>
          )}
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Un representante revisará tu solicitud y se comunicará contigo en
            breve.
          </p>

          {preparandoMensaje ? (
            <span className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#25D366]/70 px-8 text-base font-semibold text-white">
              Preparando mensaje...
            </span>
          ) : (
            <a
              href={enlaceWhatsapp(mensajeWhatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 text-base font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Solicitar por WhatsApp
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
              setEnviado(false);
              setCodigo("");
              setResumenKit(null);
            }}
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Enviar otra solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Cotizar mi obra
        </h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Cuéntanos qué necesita tu obra y recibe una cotización rápida y sin
          compromiso.
        </p>

        {errorSupabase && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            <p className="font-medium">No se pudo enviar la solicitud.</p>
            <p className="mt-1">{errorSupabase}</p>
          </div>
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
          className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="nombres" className={labelClasses}>
                Nombres
              </label>
              <input
                id="nombres"
                name="nombres"
                type="text"
                value={form.nombres}
                onChange={handleChange}
                placeholder="Ej. María Fernanda"
                className={`${inputClasses} ${fieldErrorClasses(!!errors.nombres)}`}
              />
              {errors.nombres && (
                <p className={errorClasses}>{errors.nombres}</p>
              )}
            </div>
            <div>
              <label htmlFor="apellidos" className={labelClasses}>
                Apellidos
              </label>
              <input
                id="apellidos"
                name="apellidos"
                type="text"
                value={form.apellidos}
                onChange={handleChange}
                placeholder="Ej. López Ramírez"
                className={`${inputClasses} ${fieldErrorClasses(!!errors.apellidos)}`}
              />
              {errors.apellidos && (
                <p className={errorClasses}>{errors.apellidos}</p>
              )}
            </div>
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
                Email <span className="text-zinc-400">(opcional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Ej. nombre@correo.com"
                className={`${inputClasses} ${fieldErrorClasses(!!errors.email)}`}
              />
              {errors.email && <p className={errorClasses}>{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="tipoObra" className={labelClasses}>
                Tipo de obra
              </label>
              <select
                id="tipoObra"
                name="tipoObra"
                value={form.tipoObra}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.tipoObra)}`}
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
              {errors.tipoObra && (
                <p className={errorClasses}>{errors.tipoObra}</p>
              )}
            </div>
            <div>
              <label htmlFor="kit" className={labelClasses}>
                Kit opcional
              </label>
              <select
                id="kit"
                name="kit"
                value={form.kit}
                onChange={handleChange}
                className={`${inputClasses} ${fieldErrorClasses(!!errors.kit)}`}
              >
                <option value="">Ninguno / no aplica</option>
                {kits.map((kit) => (
                  <option key={kit.id} value={kit.id}>
                    {kit.nombre}
                  </option>
                ))}
              </select>
              {errors.kit && <p className={errorClasses}>{errors.kit}</p>}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="descripcion" className={labelClasses}>
              Descripción de la obra
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={4}
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describe brevemente el alcance de tu micro-obra..."
              className={`${textareaClasses} ${fieldErrorClasses(!!errors.descripcion)}`}
            />
            {errors.descripcion && (
              <p className={errorClasses}>{errors.descripcion}</p>
            )}
          </div>

          <div className="mt-5">
            <label htmlFor="observaciones" className={labelClasses}>
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={3}
              value={form.observaciones}
              onChange={handleChange}
              placeholder="Indicaciones adicionales (opcional), por ejemplo fechas, acceso a obra, etc."
              className={`${textareaClasses} ${fieldErrorClasses(!!errors.observaciones)}`}
            />
            {errors.observaciones && (
              <p className={errorClasses}>{errors.observaciones}</p>
            )}
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={procesando}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {procesando ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}