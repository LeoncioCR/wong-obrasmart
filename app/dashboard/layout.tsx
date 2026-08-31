"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

const titulosPorRuta: Record<string, string> = {
  categorias: "Categorías",
  productos: "Productos",
  clientes: "Clientes",
  kits: "Kits",
  cotizaciones: "Cotizaciones",
  pedidos: "Pedidos",
  maquinaria: "Maquinaria",
  alquileres: "Alquileres",
  reportes: "Reportes",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const segmento = pathname.split("/")[2] ?? "";
  const titulo = titulosPorRuta[segmento] ?? "Dashboard";

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={titulo} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}