# Manual de Usuario — WONG ObraSmart

Bienvenido al manual de usuario de **WONG ObraSmart**, la plataforma inteligente para el abastecimiento de micro-obras. Este manual explica en detalle el funcionamiento de **todas las interfaces** del proyecto, tanto las públicas (sitio web para clientes) como el panel administrativo (dashboard para el equipo interno).

---

## Estructura del manual

| Documento | Contenido |
|---|---|
| [**01 - Introducción y acceso**](./01-introduccion-y-acceso.md) | Qué es la plataforma, roles de usuario, cómo acceder, y el flujo general del negocio. |
| [**02 - Interfaces públicas**](./02-interfaces-publicas.md) | Guía detallada del sitio web para clientes: Home, Catálogo, Kits, Maquinaria, Contacto, Cotizar y Login. |
| [**03 - Panel administrativo (listados)**](./03-panel-administrativo-listados.md) | Guía de las páginas de gestión: Dashboard, Productos, Kits, Clientes, Cotizaciones, Pedidos, Maquinaria, Alquileres, Categorías y DataObra. |
| [**04 - Panel administrativo (detalle y edición)**](./04-panel-administrativo-detalle-edicion.md) | Guía de los formularios de creación/edición y las páginas de detalle. |
| [**05 - Flujo del negocio y estados**](./05-flujo-negocio-y-estados.md) | Explica el ciclo completo de vida de una operación y el significado de cada estado. |

---

## Glosario rápido

- **Kits de obra**: paquetes prearmados de materiales (y opcionalmente herramientas/maquinaria) agrupados por tipo de micro-obra.
- **Cotización**: solicitud formal de un cliente pidiendo presupuesto para su obra.
- **Pedido**: la materialización de una cotización aceptada (cuando el cliente aprobó la propuesta).
- **Alquiler (RentaMicro)**: solicitud de alquiler de maquinaria bajo demanda.
- **DataObra**: sección de análisis/reportes del panel administrativo.
- **KitObra IA**: recomendador inteligente de kits dentro del sitio público.

---

## Resumen de las rutas principales

### Sitio público (clientes)

| Ruta | Página |
|---|---|
| `/` | Portada (Home) |
| `/catalogo` | Catálogo de productos |
| `/kits` | Listado de kits + recomendador KitObra IA |
| `/kits/[id]` | Detalle de un kit |
| `/maquinaria` | Maquinaria y solicitud de alquiler |
| `/contacto` | Información de contacto |
| `/cotizar` | Formulario para solicitar cotización |
| `/login` | Acceso al panel administrativo |

### Panel administrativo (equipo interno)

| Ruta | Página |
|---|---|
| `/dashboard` | Resumen ejecutivo (KPIs y reportes) |
| `/dashboard/productos` | Gestión de productos del catálogo |
| `/dashboard/categorias` | Gestión de categorías |
| `/dashboard/kits` | Gestión de kits de obra |
| `/dashboard/clientes` | Gestión de clientes |
| `/dashboard/cotizaciones` | Gestión de cotizaciones |
| `/dashboard/pedidos` | Gestión de pedidos |
| `/dashboard/maquinaria` | Gestión de maquinaria |
| `/dashboard/alquileres` | Gestión de alquileres |
| `/dashboard/dataobra` | Análisis y reportes avanzados |

---

> **Nota**: Este manual describe el comportamiento de la aplicación tal como está implementada. Consulta el documento [05 - Flujo del negocio y estados](./05-flujo-negocio-y-estados.md) para entender cómo se conectan todas las piezas.
