# 04 - Panel Administrativo: Páginas de Detalle y Edición

Esta sección detalla los **formularios de creación/edición** y las **páginas de detalle** de los registros del panel administrativo. Son las pantallas a las que llegas al pulsar los botones **"Nuevo"**, **"Ver"** o **"Editar"** en los listados descritos en el documento [03](./03-panel-administrativo-listados.md).

---

## 4.1 Producto — Nuevo / Editar

Rutas: `/dashboard/productos/nuevo` y `/dashboard/productos/[id]/editar`.

### Campos del formulario
- **Nombre** (obligatorio).
- **Categoría** (obligatoria, desde las categorías existentes).
- **Subcategoría** (de la categoría elegida).
- **Descripción** (opcional).
- **Precio** en soles (obligatorio).
- **Unidad** (ej. "por bolsa", "por millar").
- **Stock** (número inicial o actual).
- **Imagen** (URL o subida; en el listado se muestra la imagen o un dibujo por defecto de la categoría).
- Botón **"Guardar"** (ícono de disco) y **"Cancelar"**.

### Validaciones y comportamiento
- Todos los campos obligatorios deben completarse; si no, se muestra el mensaje correspondiente y no se guarda.
- Al guardar correctamente se muestra el mensaje de éxito y normalmente se redirige al listado de productos.

### Reglas de negocio
- Si **stock = 0** → el producto aparece **Agotado** (y no se muestra en el catálogo público).
- Si **stock ≤ límite bajo** → **Bajo stock**.
- Si **stock > límite bajo** → **Disponible**.

---

## 4.2 Kit — Nuevo / Editar

Rutas: `/dashboard/kits/nuevo`, `/dashboard/kits/[id]/editar` (y detalle en `/dashboard/kits/[id]`).

### Campos del formulario
- **Nombre** del kit.
- **Tipo de obra** (Falso piso, Tarrajeo, Muro, Vereda, Remodelación menor, etc.).
- **Descripción**.
- **Precio** (total del kit).
- **Imagen** (opcional).

### Listas del kit
- **Materiales**: cada registro con **producto** (selector de los productos del catálogo), **cantidad** y **unidad**. Botón **+ Agregar material**.
- **Herramientas sugeridas**: ítems con nombre/cantidad/unidad. Botón **+ Agregar herramienta**.
- **Maquinaria sugerida**: ítems con nombre/cantidad/unidad. Botón **+ Agregar maquinaria**.
- Cada fila tiene un botón para **quitar** el ítem.

### Comportamiento
- Se pueden **agregar / quitar** ítems antes de guardar.
- Al guardar, el kit queda disponible para mostrarse en el sitio público `/kits`.
- La página de **detalle** (`/dashboard/kits/[id]`) muestra todos los campos y listas en modo lectura, con botones **Editar** y **Eliminar**.

---

## 4.3 Cliente — Detalle

Ruta: `/dashboard/clientes/[id]`.

### Elementos
- **Información del cliente**: nombre, email, teléfono.
- **Historial**:
  - **Cotizaciones** del cliente (código, fecha, tipo de obra, estado).
  - **Pedidos** del cliente (código, fecha, total, estado).
- Botón **"Editar"** para modificar los datos del cliente.

### Comportamiento
- Permite ver de un vistazo todo lo que ese cliente ha cotizado o comprado.
- Desde aquí puedes navegar al **detalle de cualquier cotización o pedido** haciendo clic en su código.

---

## 4.4 Cotización — Detalle

Ruta: `/dashboard/cotizaciones/[id]`.

### Elementos
- **Código** de la cotización (ej. `COT-XXXX`).
- **Fecha** de creación.
- **Cliente**: nombre, teléfono, email.
- **Tipo de obra**.
- **Kit seleccionado** (si aplica) con su **resumen de materiales** y precio.
- **Descripción** de la obra.
- **Observaciones**.
- **Estado actual** (con color) y **selector/cambiar estado**.

### Cambio de estado
En el detalle puedes cambiar el estado de la cotización. El flujo típico es:

`Nueva → En revisión → Cotizada → Aceptada` (o `Rechazada` / `Anulada`).

- Al pasar a **Aceptada**, el sistema habilita la opción de **crear el pedido** (conversión). Consulta el documento [05](./05-flujo-negocio-y-estados.md).
- Botones de acción según el estado (p.ej. "Aceptar", "Rechazar", "Marcar como cotizada", "Convertir en pedido").

---

## 4.5 Pedido — Detalle

Ruta: `/dashboard/pedidos/[id]`.

### Elementos
- **Código** del pedido.
- **Cliente**.
- **Fecha**.
- **Ítems del pedido**: lista de **materiales** (producto, cantidad, unidad, subtotal) y de **maquinaria** (si aplica), con su **precio**.
- **Total** del pedido.
- **Estado** actual (con color) y **selector/cambiar estado**.
- **Información de pago** (si aplica).

### Cambio de estado
El flujo típico es:

`Pendiente → Confirmado → En proceso → Enviado → Entregado`

- **Anulado** puede darse en cualquier punto.
- En el detalle puedes **registrar el pago** y/o **avanzar el estado** manualmente.
- Se puede navegar a la **cotización de origen** si el pedido proviene de una.

---

## 4.6 Alquiler — Detalle

Ruta: `/dashboard/alquileres/[id]`.

### Elementos
- **Código** del alquiler.
- **Cliente** (nombre, teléfono).
- **Maquinaria** (nombre).
- **Fechas**: inicio y fin.
- **Días** y **total estimado**.
- **Observaciones**.
- **Estado** actual (con color) y **selector/cambiar estado**.

### Cambio de estado
El flujo típico es:

`Pendiente → Confirmado → En curso → Devuelto`

- **Anulado** puede darse en cualquier punto.
- Al actualizar el estado, el sistema refleja la disponibilidad del equipo en la sección **Maquinaria** (un equipo queda "En alquiler" mientras la operación no esté "Devuelta"/"Anulada").

---

## Reglas generales de los formularios del panel

1. **Campos obligatorios**: se marcan con asterisco y se validan al guardar.
2. **Mensajes**:
   - **Éxito**: se muestra un aviso verde ("Registro guardado correctamente.", etc.) y normalmente se redirige al listado.
   - **Error**: se muestra un aviso rojo ("Error al guardar.", "No se pudo eliminar: tiene registros asociados.", etc.) y la pantalla permanece.
3. **Eliminación**: siempre pide **confirmación** antes de borrar. Si el registro está referenciado por otros, se bloquea el borrado y se informa al usuario.
4. **Cancelar**: el botón **"Cancelar"** descarta los cambios y vuelve al listado.
