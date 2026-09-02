"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import AdminNotifications from "./AdminNotifications";

interface AdminHeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function AdminHeader({
  title = "Dashboard",
  onMenuClick,
}: AdminHeaderProps) {
  const router = useRouter();
  const [cerrando, setCerrando] = useState(false);

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error.message);
      }
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Abrir menú"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block dark:bg-zinc-700" />
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:flex dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              En línea
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <AdminNotifications />

          <button
            type="button"
            onClick={() => void cerrarSesion()}
            disabled={cerrando}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span className="hidden sm:inline">
              {cerrando ? "Cerrando..." : "Salir"}
            </span>
          </button>

          <div className="ml-1 flex items-center gap-3 border-l border-zinc-200 pl-3 sm:pl-4 dark:border-zinc-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-bold text-white shadow-sm shadow-red-500/30">
              A
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-tight text-zinc-900 dark:text-zinc-50">
                Administrador
              </p>
              <p className="text-xs leading-tight text-zinc-500 dark:text-zinc-400">
                admin@wong.pe
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
