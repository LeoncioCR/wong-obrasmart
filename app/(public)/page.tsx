import Link from "next/link";

const benefits = [
  {
    title: "Materiales para tu obra",
    description:
      "Todo lo que necesitas en un solo lugar, listo para pedir y coordinar.",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    title: "Kits organizados",
    description:
      "Agrupados por tipo de micro-obra para ahorrar tiempo y evitar faltantes.",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Maquinaria bajo demanda",
    description:
      "Equipos disponibles cuando los necesitas, sin inversión inicial.",
    icon: (
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
        <path d="M6 12h4" />
        <circle cx="16" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Cotización rápida",
    description:
      "Recibe tu cotización en minutos y avanza tu obra sin demoras.",
    icon: (
      <svg
        className="h-6 w-6"
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
    ),
  },
];

const featuredKits = [
  {
    name: "Falso piso",
    description:
      "Materiales para preparar una base nivelada y lista para el acabado de tu piso.",
  },
  {
    name: "Tarrajeo",
    description:
      "Todo lo necesario para el acabado de muros y superficies con tarrajeo liso.",
  },
  {
    name: "Muro",
    description:
      "Bloques, ladrillos, cemento y arena para levantar muros resistentes.",
  },
  {
    name: "Vereda",
    description:
      "Concreto, encofrado y refuerzos para veredas y sardineles bien terminados.",
  },
  {
    name: "Remodelación menor",
    description:
      "Lo esencial para renovar espacios pequeños sin detener tu día a día.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-start text-left">
          <p className="mb-4 rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            WONG · Abastecimiento inteligente
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
            ObraSmart
          </h1>
          <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Plataforma inteligente para abastecimiento de micro-obras.
            Consigue materiales, kits y maquinaria para tu proyecto de forma
            rápida y sin complicaciones.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/cotizar"
              className="inline-flex h-12 items-center justify-center rounded-full bg-red-600 px-8 text-base font-semibold text-white transition-colors hover:bg-red-700"
            >
              Cotizar mi obra
            </Link>
            <Link
              href="/kits"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Ver kits
            </Link>
          </div>
        </div>

        <div
          aria-hidden
          className="flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
            <svg
              className="h-12 w-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <p className="text-sm font-medium">Imagen de obra</p>
          </div>
        </div>
      </main>

      <section className="mx-auto mt-20 w-full max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          ¿Por qué ObraSmart?
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Todo lo que tu micro-obra necesita, gestionado en una sola
          plataforma.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-600/40 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:text-red-500">
                {benefit.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Kits de obra destacados
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Paquetes prearmados con los materiales justos para cada tipo de
          micro-obra.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredKits.map((kit) => (
            <div
              key={kit.name}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-red-600/40 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {kit.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {kit.description}
              </p>
              <Link
                href="/kits"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-semibold text-zinc-900 transition-colors hover:border-red-600/40 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-50 dark:hover:text-red-500"
              >
                Ver kit
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}