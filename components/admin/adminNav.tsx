import type { ReactNode } from "react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const iconProps = {
  className: "h-5 w-5 shrink-0",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/productos",
    label: "Productos",
    icon: (
      <svg {...iconProps}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    href: "/dashboard/categorias",
    label: "Categorías",
    icon: (
      <svg {...iconProps}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
        <circle cx="7" cy="7" r="1.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/kits",
    label: "Kits",
    icon: (
      <svg {...iconProps}>
        <path d="m12 2 10 6.5-10 6.5L2 8.5 12 2Z" />
        <path d="m2 12.5 10 6.5 10-6.5" />
        <path d="m2 17 10 6.5 10-6.5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/cotizaciones",
    label: "Cotizaciones",
    icon: (
      <svg {...iconProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    ),
  },
  {
    href: "/dashboard/pedidos",
    label: "Pedidos",
    icon: (
      <svg {...iconProps}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    ),
  },
  {
    href: "/dashboard/maquinaria",
    label: "Maquinaria",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
        <path d="M6 12h4" />
        <circle cx="16" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/alquileres",
    label: "Alquileres",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <circle cx="15" cy="14" r="2.5" />
        <path d="M15 12.5V14l1.2 1.2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/dataobra",
    label: "DataObra",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="6" width="4" height="14" rx="1" />
        <rect x="16" y="9" width="4" height="11" rx="1" />
      </svg>
    ),
  },
];