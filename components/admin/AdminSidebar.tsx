"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "./adminNav";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-red-950/90 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-600/40">
          <svg
            className="h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 20h20" />
            <path d="M4 20V9l4-3v14" />
            <path d="M8 20V6l4-3v17" />
            <path d="M12 20V8l4-2v14" />
            <path d="M16 20V4l4 2v14" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-extrabold uppercase tracking-tight text-white">
            WONG
          </span>
          <span className="text-xs font-semibold text-red-400">ObraSmart</span>
        </div>
      </div>

      <p className="px-6 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        Panel administrativo
      </p>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {adminNavItems.map((item) => {
          const isIndex = item.href === "/dashboard";
          const isActive = isIndex
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-red-600/15 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              {isActive && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-red-500" />
              )}
              <span
                className={`transition-colors ${
                  isActive
                    ? "text-red-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Sistema operativo
        </p>
        <p className="mt-1 text-xs text-zinc-600">WONG ObraSmart · Admin v0.1</p>
      </div>
    </div>
  );
}

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
  className = "",
}: AdminSidebarProps) {
  const isControlled = mobileOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? mobileOpen : internalOpen;
  const close = () => {
    if (isControlled) onMobileClose?.();
    else setInternalOpen(false);
  };

  const handleNavigate = () => close();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <>
      <aside
        className={`hidden lg:sticky lg:top-0 lg:block lg:h-screen ${className}`}
        aria-label="Menú administrativo"
      >
        <div className="flex h-full w-64 flex-col">
          <SidebarContent />
        </div>
      </aside>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <SidebarContent onNavigate={handleNavigate} />
      </div>

      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden
        />
      )}
    </>
  );
}
