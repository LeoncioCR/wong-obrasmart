# 03 - Panel Administrativo: Páginas de Listado

Esta sección explica en detalle las páginas del panel administrativo que **listan y gestionan** los registros de la operación: Dashboard, Productos, Categorías, Kits, Clientes, Cotizaciones, Pedidos, Maquinaria, Alquileres y DataObra.

Todas ellas se acceden tras iniciar sesión (ver [01 - Introducción y acceso](./01-introduccion-y-acceso.md)) y comparten la barra lateral y la barra superior descritas allí.

---

## 3.1 Dashboard — `/dashboard`

**Propósito**: resumen ejecutivo del negocio con indicadores clave (KPIs), contadores por estado y la actividad reciente.

### Elementos
1. **Título a la izquierda**: "Dashboard" / "Panel de control".
2. **Controles superiores**:
   - **Buscador** para filtrar el historial de cotizaciones y pedidos por **código** (p.ej. `COT-1234`).
   - **Selector de rango de fechas**: puede ser mensual, semanal o por un período personalizado.
3. **Tarjetas de KPIs** (métricas con su variación):
   - **Ventas**: total de ventas en el período.
   - **Pedidos**: número total de pedidos.
   - **Clientes**: clientes registrados.
   - **Retorno de clientes**: clientes que repiten.
   - **Cotizaciones**: total de cotizaciones generadas.
   - **Tasa de conversión** (cotizaciones → pedidos).
4. **Gráficos con barras de progreso** (CSS) para comparar métricas por período (ej. ventas, pedidos, clientes) entre el período actual y el anterior.
5. **Contadores por estado**:
   - **Cotizaciones**: Nueva, En revisión, Cotizada, Aceptada, Rechazada y Anulada.
   - **Pedidos**: Pendiente, Confirmado, En proceso, Enviado, Entregado y Anulado.
   - **Alquileres**: Pendiente, Confirmado, En curso, Devuelto y Anulado.
   - **Maquinaria**: Disponible y En alquiler.
6. **Tabla de actividad reciente** (Últimas cotizaciones y/o pedidos) con columnas de código, cliente, tipo de obra, fecha y estado.
7. **Métricas por máquina** (tiempo de uso/uptime de los equipos en el período).

### Interacción del usuario
- Cambia el rango de fechas o escribe un código para filtrar el historial.
- Al hacer clic en un código de cotización o pedido, navega a su **detalle**.

---

## 3.2 Productos — `/dashboard/productos`

**Propósito**: gestionar el **catálogo de productos** que se muestran en la página pública `/catalogo`.

### Elementos
- **Título "Productos"** + botón **"+ Nuevo producto"** → `/dashboard/productos/nuevo`.
- **Contador** del total de productos (ej. "X productos").
- **Buscador** por nombre (filtra en tiempo real, ignora mayúsculas/tildes).
- **Filtro de categoría** (Todos + categorías existentes).
- **Tabla de productos**, con columnas:
  - **Producto** (imagen + nombre + categoría).
  - **Precio** (S/).
  - **Unidad**.
  - **Stock** (número).
  - **Estado** (Disponible / Bajo stock / Agotado).
  - **Acciones**: **Ver** (lleva al detalle de edición), **Editar** y **Eliminar**.

### Acciones
- **Nuevo producto**: abre el formulario de creación (ver documento 04).
- **Editar** (lápiz): abre `/dashboard/productos/[id]/editar`.
- **Eliminar** (basurero): muestra **confirmación** antes de borrar. Al confirmar borra el producto. (Si el producto está referenciado por otros registros, el sistema podría mostrar un error y evitar el borrado.)

### Estados de un producto
| Estado | Condición | Color |
|---|---|---|
| **Disponible** | stock > límite bajo | Verde |
| **Bajo stock** | stock ≤ límite bajo (pero > 0) | Ámbar |
| **Agotado** | stock = 0 | Rojo |

---

## 3.3 Categorías — `/dashboard/categorias`

**Propósito**: gestionar las **categorías y subcategorías** de los productos.

### Elementos
- **Título "Categorías"** + botón **"+ Nueva categoría"**.
- **Tabla/lista de categorías**: nombre, subcategorías, y acciones (Editar / Eliminar).

### Acciones
- **Nueva / Editar categoría**: formulario con **Nombre** y listado de **Subcategorías**.
- **Eliminar**: con confirmación.

> **Nota**: Eliminar una categoría que tenga productos puede estar bloqueado para evitar perder datos.

---

## 3.4 Kits — `/dashboard/kits`

**Propósito**: gestionar los **kits de obra** prearmados (visibles en `/kits`).

### Elementos
- **Título "Kits"** + botón **"+ Nuevo kit"** → `/dashboard/kits/nuevo`.
- **Contador** de kits.
- **Buscador** por nombre.
- **Filtro de tipo de obra**.
- **Tabla de kits**: nombre, tipo de obra, precio, listas de materiales/herramientas/maquinaria (resumen), y acciones.

### Acciones
- **Nuevo kit**: abre el formulario de creación (documento 04).
- **Ver** (ojos): abre `/dashboard/kits/[id]` (detalle).
- **Editar**: abre `/dashboard/kits/[id]/editar`.
- **Eliminar**: con confirmación.

> **Nota**: Al editar materiales/herramientas de un kit se puede usar un selector de productos existentes.

---

## 3.5 Clientes — `/dashboard/clientes`

**Propósito**: gestionar la **base de clientes** que han cotizado o comprado.

### Elementos
- **Título "Clientes"**.
- **Buscador** por nombre, email o teléfono.
- **Tabla de clientes**: nombre, email, teléfono, y acciones (**Ver** → `/dashboard/clientes/[id]`).

### Acciones
- **Ver detalle**: abre la ficha del cliente con su **historial** de cotizaciones y pedidos.
- En el detalle se puede **editar** la información del cliente.

---

## 3.6 Cotizaciones — `/dashboard/cotizaciones`

**Propósito**: gestionar las **solicitudes de cotización** que llegan desde el sitio público (el "embudo" comercial).

### Elementos
- **Título "Cotizaciones"**.
- **Contador** por estado (p.ej. "Nueva · X · En revisión · ...").
- **Filtro rápido por estado** y **buscador** por código o nombre del cliente.
- **Tabla de cotizaciones**: código, cliente, tipo de obra, fecha, estado (con color) y acciones.

### Estados y colores
| Estado | Color |
|---|---|
| **Nueva** | Azul |
| **En revisión** | Ámbar |
| **Cotizada** | Cian |
| **Aceptada** | Verde |
| **Rechazada** | Rojo |
| **Anulada** | Gris |

### Acciones
- **Ver detalle** (código o botón): abre `/dashboard/cotizaciones/[id]`.
- Desde el detalle se **cambia el estado** y se pueden ver los detalles del cliente, tipo de obra y observaciones.

---

## 3.7 Pedidos — `/dashboard/pedidos`

**Propósito**: gestionar los **pedidos** que resultan de cotizaciones aceptadas y se preparan/despachan.

### Elementos
- **Título "Pedidos"**.
- **Contador** por estado.
- **Filtro rápido por estado** y **buscador** (código de pedido o cliente).
- **Tabla de pedidos**: código, cliente, fecha, total, estado (con color) y acciones.

### Estados y colores
| Estado | Color |
|---|---|
| **Pendiente** | Ámbar |
| **Confirmado** | Azul |
| **En proceso** | Cian |
| **Enviado** | Índigo |
| **Entregado** | Verde |
| **Anulado** | Rojo |

### Acciones
- **Ver detalle** (`/dashboard/pedidos/[id]`).
- De ahí se puede **avanzar el estado** manualmente o **registrar el pago**, y ver los ítems (materiales y maquinaria) del pedido.

> **Nota**: La creación de pedidos suele hacerse desde una cotización aceptada (ver documento 04 y 05).

---

## 3.8 Maquinaria — `/dashboard/maquinaria`

**Propósito**: gestionar los **equipos de maquinaria** que se ofrecen para alquiler (RentaMicro).

### Elementos
- **Título "Maquinaria"** + botón (según implementación) para agregar equipo.
- **Tabla/tarjetas de equipos**: nombre, categoría, precio por día, estado (Disponible / En alquiler) y acciones.
- **Buscador** por nombre.

### Estados
| Estado | Color |
|---|---|
| **Disponible** | Verde |
| **En alquiler** | Rojo / Ámbar |

### Acciones
- **Editar** equipo (nombre, precio, descripción, imagen, disponibilidad).
- **Eliminar** (con confirmación).

---

## 3.9 Alquileres — `/dashboard/alquileres`

**Propósito**: gestionar las **solicitudes/operaciones de alquiler** de maquinaria (RentaMicro).

### Elementos
- **Título "Alquileres"**.
- **Contador** por estado.
- **Filtro por estado** y **buscador** (código, equipo o cliente).
- **Tabla de alquileres**: código, cliente, maquinaria, fechas (inicio/fin), total, estado y acciones.

### Estados y colores
| Estado | Color |
|---|---|
| **Pendiente** | Ámbar |
| **Confirmado** | Azul |
| **En curso** | Verde |
| **Devuelto** | Gris/Cian |
| **Anulado** | Rojo |

### Acciones
- **Ver detalle** (`/dashboard/alquileres/[id]`): muestra cliente, maquinaria, fechas, total y estado.
- Actualizar el estado a lo largo del ciclo (Pendiente → Confirmado → En curso → Devuelto).

---

## 3.10 DataObra — `/dashboard/dataobra`

**Propósito**: módulo de **análisis y reportes** para la toma de decisiones ejecutivas.

### Elementos (según implementación)
- **KPIs y gráficos** de la operación (ventas, pedidos, rentabilidad).
- **Análisis por categoría / tipo de obra / cliente**.
- **Filtros** por rango de fechas.
- Mostrar **tendencias** de los indicadores en el tiempo.

> **Nota**: Este módulo consolida la información de cotizaciones, pedidos y alquileres. El alcance exacto de sus reportes depende de la configuración del proyecto; se recomienda revisar la sección correspondiente del código y del documento 05.
