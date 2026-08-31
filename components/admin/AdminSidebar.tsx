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
    <div className="flex h-full flex-col">
      <div className="flex items-baseline gap-1.5 px-6 py-5">
        <span className="text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-zinc-50">
          WONG
        </span>
        <span className="text-lg font-semibold text-red-600 dark:text-red-500">
          ObraSmart
        </span>
      </div>
      <p className="px-6 pb-2 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-red-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500">
        WONG ObraSmart · Admin v0.1
      </p>
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
        <div className="h-full w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <SidebarContent />
        </div>
      </aside>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform dark:bg-zinc-950 lg:hidden ${
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