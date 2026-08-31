"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";

const traducirError = (mensaje: string) => {
  if (/invalid login credentials/i.test(mensaje)) {
    return "Email o contraseña incorrectos.";
  }
  if (/email not confirmed/i.test(mensaje)) {
    return "El correo aún no ha sido confirmado.";
  }
  if (/too many requests/i.test(mensaje)) {
    return "Demasiados intentos. Inténtalo nuevamente en unos minutos.";
  }
  return mensaje;
};

export default function LoginPage() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const iniciarSesion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setEnviando(true);

    const datos = new FormData(e.currentTarget);
    const email = String(datos.get("email") ?? "").trim();
    const password = String(datos.get("password") ?? "");

    const { error: errorAuth } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (errorAuth) {
      setError(traducirError(errorAuth.message));
      setEnviando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex flex-1 flex-col justify-center bg-zinc-50 px-4 py-16 sm:px-6 lg:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Link href="/" className="flex flex-col items-center text-center">
            <span className="text-xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
              WONG <span className="text-red-600">ObraSmart</span>
            </span>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Acceso al panel administrativo
            </p>
          </Link>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => void iniciarSesion(e)}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="admin@wong.pe"
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="h-12 w-full rounded-full bg-red-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-6 border-t border-zinc-200 pt-5 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Acceso restringido al personal autorizado de WONG ObraSmart.
          </p>
        </div>
      </div>
    </main>
  );
}