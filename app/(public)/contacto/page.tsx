"use client";

import { inputClasses, labelClasses, textareaClasses } from "@/lib/formClasses";
import {
  WHATSAPP_NUMBER,
  enlaceWhatsapp,
  whatsappTelefonoLegible,
} from "@/lib/whatsapp";

const PHONE = whatsappTelefonoLegible();
const PHONE_HREF = `tel:+${WHATSAPP_NUMBER}`;
const WHATSAPP_HREF = enlaceWhatsapp("");

export default function ContactoPage() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-500">
          WONG · Contacto
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Contacto
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          WONG ObraSmart es la plataforma inteligente para el abastecimiento de
          micro-obras: materiales, kits organizados y maquinaria bajo demanda,
          todo en un solo lugar para que tu obra avance rápido y sin
          complicaciones.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                Información de contacto
              </h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li>
                  <a
                    href={PHONE_HREF}
                    className="flex items-center gap-3 text-zinc-700 transition-colors hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-500"
                  >
                    <svg
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/10 p-2 text-red-600 dark:text-red-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>
                      Teléfono: <span className="font-medium">{PHONE}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-zinc-700 transition-colors hover:text-red-600 dark:text-zinc-300 dark:hover:text-red-500"
                  >
                    <svg
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/10 p-2 text-red-600 dark:text-red-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    <span>WhatsApp: <span className="font-medium">Escríbenos</span></span>
                  </a>
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/10 p-2 text-red-600 dark:text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    Dirección:{" "}
                    <span className="font-medium">
                      Av. Principal 1234, San Isidro, Lima
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <svg
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/10 p-2 text-red-600 dark:text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>
                    Horario:{" "}
                    <span className="font-medium">
                      Lun – Sáb · 8:00 a 18:00
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
              Formulario de contacto
            </h2>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-6 space-y-5"
            >
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
                <label htmlFor="email" className={labelClasses}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="Ej. nombre@correo.com"
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="mensaje" className={labelClasses}>
                  Mensaje
                </label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  rows={4}
                  required
                  placeholder="Escribe tu consulta..."
                  className={textareaClasses}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 text-base font-semibold text-white shadow-md shadow-red-600/30 transition-all hover:from-red-700 hover:to-red-600 hover:shadow-lg hover:shadow-red-600/40 sm:w-auto"
              >
                Enviar mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}