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
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/40">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-red-500/10 blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div className="flex flex-col items-start text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              WONG · Abastecimiento inteligente
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              ObraSmart
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
              Plataforma inteligente para abastecimiento de micro-obras.
              Consigue materiales, kits y maquinaria para tu proyecto de forma
              rápida y sin complicaciones.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/cotizar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-8 text-base font-semibold text-white shadow-lg shadow-red-600/40 transition-all hover:from-red-700 hover:to-red-600 hover:shadow-xl hover:shadow-red-600/50"
              >
                Cotizar mi obra
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/kits"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur transition-all hover:border-white/40 hover:bg-white/10"
              >
                Ver kits
              </Link>
            </div>
          </div>

          <div
            aria-hidden
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
            <div className="relative flex flex-col items-center gap-3 text-zinc-300">
              <svg
                className="h-16 w-16 text-red-400/80"
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
              <p className="text-sm font-medium text-zinc-400">
                Imagen de obra
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-500">
            Beneficios
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            ¿Por qué ObraSmart?
          </h2>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Todo lo que tu micro-obra necesita, gestionado en una sola
            plataforma.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-red-600/40 hover:shadow-lg hover:shadow-red-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-red-500/30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/10 text-red-600 transition-transform duration-300 group-hover:scale-110 dark:text-red-500">
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

      <section className="mx-auto mt-20 w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-600 dark:text-red-500">
            Kits destacados
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Kits de obra destacados
          </h2>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            Paquetes prearmados con los materiales justos para cada tipo de
            micro-obra.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredKits.map((kit) => (
            <div
              key={kit.name}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-red-600/40 hover:shadow-lg hover:shadow-red-600/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-red-500/30"
            >
              <span className="h-1.5 w-10 rounded-full bg-red-600 transition-all duration-300 group-hover:w-16" />
              <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {kit.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {kit.description}
              </p>
              <Link
                href="/kits"
                className="group/btn mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-5 text-sm font-semibold text-zinc-900 transition-colors hover:border-red-600 hover:bg-red-600 hover:text-white dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-red-600 dark:hover:text-white"
              >
                Ver kit
                <svg
                  className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
