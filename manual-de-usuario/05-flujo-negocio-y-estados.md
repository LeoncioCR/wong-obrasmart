# 05 - Flujo del Negocio y Estados

Este documento explica **cómo se conectan todas las piezas** de WONG ObraSmart: desde que un cliente navega el sitio hasta que la operación se entrega y se cierra. También define el significado de **cada estado** de las entidades principales.

---

## 5.1 Mapa general de la operación

```
 Cliente (sitio público)                 Administrador (panel)
 ----------------------                  -----------------------
 1. Navega /, /catalogo, /kits           --
 2. Usa KitObra IA (recomendador)        --
 3. Llene el formulario /cotizar     --> 4. Recibe notificación "nueva cotización"
                                              (cambia estado: nueva → en_revision)
                                        5. Elabora propuesta (cotizada)
 6. Acepta la propuesta por WhatsApp --> 7. Cambia estado a aceptada
                                        8. Convierte cotización en PEDIDO
                                        9. Prepara y despacha (avanza estados)
 Observación: si hay maquinaria      --> 10. Gestiona ALQUILER aparte
                                        11. Consolida todo en DataObra
```

---

## 5.2 Entidades y sus estados

### Cotización (Cotizaciones)

Representa **la solicitud de presupuesto** de un cliente.

| Estado | Significado | Color |
|---|---|---|
| **Nueva** | Acaba de llegar del sitio público / formulario. | Azul |
| **En revisión** | El equipo la está atendiendo. | Ámbar |
| **Cotizada** | Ya se envió una propuesta con precios al cliente. | Cian |
| **Aceptada** | El cliente aprobó la propuesta (listo para pedido). | Verde |
| **Rechazada** | El cliente no aceptó la propuesta. | Rojo |
| **Anulada** | Se descartó internamente (duplicada, mal ingresada, etc.). | Gris |

**Transiciones típicas**:
```
Nueva → En revisión → Cotizada → Aceptada → [Pedido]
                \                    \
                 └→ Anulada          └→ Rechazada
```

---

### Pedido (Pedidos)

Representa la **operación de venta** que se prepara y entrega. Normalmente nace de una **cotización aceptada**.

| Estado | Significado | Color |
|---|---|---|
| **Pendiente** | Recién creado, sin procesar. | Ámbar |
| **Confirmado** | Validado por el equipo. | Azul |
| **En proceso** | Se está preparando / armando. | Cian |
| **Enviado** | En ruta / despachado. | Índigo |
| **Entregado** | Llegó al cliente. Fin del ciclo. | Verde |
| **Anulado** | Cancelado antes de la entrega. | Rojo |

**Transiciones típicas**:
```
Pendiente → Confirmado → En proceso → Enviado → Entregado
    \       \          \            \
     └───────┴──────────┴────────────→ Anulado
```

> El pedido copia los **materiales** y, si aplica, la **maquinaria** de la cotización aceptada.

---

### Alquiler (Alquileres / RentaMicro)

Representa una **operación de alquiler de maquinaria**.

| Estado | Significado | Color |
|---|---|---|
| **Pendiente** | Solicitud recibida. | Ámbar |
| **Confirmado** | Aprobado; se reserva el equipo. | Azul |
| **En curso** | El equipo está en uso por el cliente. | Verde |
| **Devuelto** | El equipo regresó. Fin del ciclo. | Gris/Cian |
| **Anulado** | Se canceló el alquiler. | Rojo |

**Transiciones típicas**:
```
Pendiente → Confirmado → En curso → Devuelto
    \       \            \
     └───────┴────────────→ Anulado
```

> Mientras un alquiler esté **Confirmado** o **En curso**, el equipo figura como **"En alquiler"** en la sección **Maquinaria**. Al quedar **Devuelto** o **Anulado**, el equipo vuelve a **"Disponible"**.

---

### Producto (Catálogo)

El **estado del stock** se calcula automáticamente con un límite bajo configurado:

| Estado | Condición | Color |
|---|---|---|
| **Disponible** | stock > límite bajo | Verde |
| **Bajo stock** | 0 < stock ≤ límite bajo | Ámbar |
| **Agotado** | stock = 0 | Rojo |

> Los productos **Agotados** no se muestran en el catálogo público `/catalogo`.

---

### Maquinaria (Equipos)

| Estado | Significado | Color |
|---|---|---|
| **Disponible** | Se puede solicitar un alquiler. | Verde |
| **En alquiler** | Tiene un alquiler activo (confirmado/en curso). | Rojo |

---

## 5.3 Flujo paso a paso recomendado

1. **El cliente genera la cotización** desde `/cotizar` (o `/kits/[id]` → "Solicitar cotización", o desde el recomendador KitObra IA).
2. **El administrador ve la notificación** en la campana del panel y revisa el detalle de la cotización (`COT-XXXX`).
3. **Atiende la cotización**: la marca **En revisión** y luego **Cotizada**, enviando la propuesta al cliente (por WhatsApp).
4. **Cliente acepta**: el administrador cambia a **Aceptada**.
5. **Convertir en pedido**: desde la cotización aceptada, se crea el **Pedido**. Se verifica materiales y total.
6. **Despachar**: el pedido pasa por **Pendiente → Confirmado → En proceso → Enviado → Entregado**. Se registra el pago cuando corresponda.
7. **Si hay maquinaria**: se crea y gestiona un **Alquiler** en paralelo hasta **Devuelto**.
8. **Analizar**: toda la información alimenta el **Dashboard** y **DataObra** para métricas y decisiones.

---

## 5.4 Conversión: Cotización → Pedido

- Solo se puede crear un pedido a partir de una cotización en estado **Aceptada**.
- El pedido **hereda** los datos del cliente, los materiales (del kit y/o de la descripción) y el total.
- Una vez creado, el pedido tiene su **propio ciclo de estados**, independiente de la cotización.
- En el dashboard los contadores y KPIs distinguen **cotizaciones** de **pedidos** para calcular la **tasa de conversión** (pedidos / cotizaciones), que es un indicador clave del negocio.

---

## 5.5 Integraciones externas

- **WhatsApp**: los formularios públicos ("Solicitar por WhatsApp") **abren** un chat de WhatsApp con un mensaje pre-llenado que resume la operación. El cliente y el equipo se comunican por ahí.
- **Inteligencia artificial (GROQ)**: el **KitObra IA** usa un modelo de IA para recomendar materiales/herramientas/maquinaria según tipo de obra y área. Si no hay clave configurada, usa una recomendación local de respaldo.
- **Supabase**: es la base de datos y el backend (autenticación, notificaciones en tiempo real, persistencia de registros).

---

## 5.6 Resumen de indicadores del Dashboard

| Indicador | Cómo se calcula |
|---|---|
| **Ventas** | Suma de totales de pedidos (no anulados) en el período. |
| **Pedidos** | Conteo de pedidos creados en el período. |
| **Clientes** | Conteo de clientes registrados en el período. |
| **Retorno de clientes** | Clientes con más de una operación. |
| **Cotizaciones** | Conteo de cotizaciones generadas. |
| **Tasa de conversión** | (Pedidos / Cotizaciones) × 100. |
| **Uptime de maquinaria** | Tiempo en uso promedio de los equipos (DataObra). |

---

Este manual describe el comportamiento de la aplicación tal como está implementada actualmente. Si deseas ajustar algún estado, flujo o comportamiento, dirígete a los archivos correspondientes del proyecto (secciones `app/dashboard/` y `app/(public)/`, servicios de Supabase y la lógica de conversión de estados).
