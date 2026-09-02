# 02 - Interfaces Públicas (Sitio Web para Clientes)

Esta sección detalla el funcionamiento de **todas las páginas públicas** de WONG ObraSmart, es decir, las que no requieren iniciar sesión. Son las que el **cliente/visitante** utiliza para conocer la plataforma, explorar productos, cotizar y alquilar maquinaria.

> **Navegación común**: todas las páginas públicas comparten una **barra superior (Header)** y un **pie de página (Footer)**.

---

## 2.0 Header (barra de navegación superior)

Presente en todas las páginas públicas. Incluye:

- **Logo** de WONG ObraSmart (icono de edificio rojo + texto). Al hacer clic vuelve a la portada (`/`).
- **Menú de navegación**:
  - **Inicio** → `/`
  - **Catálogo** → `/catalogo`
  - **Kits** → `/kits`
  - **Maquinaria** → `/maquinaria`
  - **Contacto** → `/contacto`
  - **Ingresar** → `/login`
- **Botón "Cotizar"** (destacado) → `/cotizar`. Se muestra en escritorio y dentro del menú móvil.
- La sección actual se resalta con fondo rojo.
- En **móvil**: aparece un botón de menú (hamburguesa) que abre/cierra la navegación vertical.

---

## 2.1 Portada — `/`

**Propósito**: página de presentación que muestra la propuesta de valor y dirige al usuario hacia cotizar o ver kits.

### Elementos
1. **Sección principal (Hero)**:
   - Etiqueta: "WONG · Abastecimiento inteligente".
   - Título grande: **ObraSmart**.
   - Descripción de la plataforma.
   - Botones: **"Cotizar mi obra"** (rojo, lleva a `/cotizar`) y **"Ver kits"** (lleva a `/kits`).
   - Imagen ilustrativa de obra (decorativa).
2. **Sección "¿Por qué ObraSmart?"** (4 tarjetas de beneficios):
   - Materiales para tu obra.
   - Kits organizados.
   - Maquinaria bajo demanda.
   - Cotización rápida.
3. **Sección "Kits de obra destacados"** (5 kits de ejemplo): Falso piso, Tarrajeo, Muro, Vereda y Remodelación menor. Cada uno con botón **"Ver kit"** que lleva a `/kits`.

### Interacción del usuario
- Es una página **estática** (solo navegación). No hay formularios ni datos dinámicos.
- El usuario simplemente lee y hace clic en los botones de navegación.

---

## 2.2 Catálogo — `/catalogo`

**Propósito**: mostrar los **productos disponibles** para micro-obras, con búsqueda por nombre y filtros por subcategoría.

### Elementos
- **Título "Catálogo"** con etiqueta "WONG · Catálogo".
- **Buscador**: campo de texto "Buscar por nombre..." que filtra **en tiempo real** (ignora mayúsculas y tildes).
- **Filtros por subcategoría** (botones tipo "chip"): Todos, Cemento, Agregados, Ladrillos, Fierro, Herramientas, Pintura, Tuberías.
  - Al hacer clic en una subcategoría se activa el filtro (botón en rojo).
  - Hacer clic de nuevo la desactiva (vuelve a "Todos").
- **Rejilla de productos**: cada tarjeta muestra:
  - Imagen del producto (o un dibujo de categoría si no tiene imagen).
  - Chip de categoría.
  - Nombre del producto.
  - Descripción.
  - **Precio** en soles (ej. "S/ 22.50").
  - Unidad (ej. "por bolsa").
  - **Estado de stock** con color: Disponible (verde), Bajo stock (ámbar), Agotado (rojo).

### Interacción del usuario
1. Escribe en el buscador y/o toca un chip de subcategoría.
2. La lista se filtra al instante combinando ambos criterios.
3. Los productos con estado "Agotado" **no aparecen** en el catálogo.

### Mensajes posibles
- Mientras carga: "Cargando productos...".
- Sin resultados: "No se encontraron productos para '[término]'." o "No se encontraron productos."
- Error de conexión: "No se pudieron cargar los productos."

> **Nota**: Desde el catálogo **no se puede cotizar/comprar un producto directamente**; solo se visualiza. Para cotizar, el cliente usa el formulario de `/cotizar`.

---

## 2.3 Kits — `/kits`

**Propósito**: listar los **kits de obra** prearmados y ofrecer un **recomendador inteligente (KitObra IA)** para ayudar al cliente a elegir el kit adecuado.

### Elementos
- **Título "Kits"** con etiqueta "WONG · Kits".
- **Componente "KitObra IA"** (recomendador, ver sección 2.5).
- **Rejilla de kits**: cada tarjeta muestra:
  - Chip de tipo de obra.
  - Nombre del kit.
  - Descripción.
  - **Precio referencial** en soles.
  - Botón **"Ver detalle"** → `/kits/[id]`.

### Interacción del usuario
1. Hace clic en "Ver detalle" para ver el contenido completo de un kit.
2. Opcionalmente usa el **KitObra IA** para obtener una recomendación personalizada (ver sección 2.5).

### Mensajes posibles
- "Cargando kits...", "No hay kits disponibles." o "No se pudieron cargar los kits."

---

## 2.4 Detalle de Kit — `/kits/[id]`

**Propósito**: mostrar el contenido completo de un kit (materiales, herramientas y maquinaria) y su precio, con opción de solicitar cotización.

### Elementos
- Enlace **"Volver a kits"**.
- Chip de **tipo de obra** + **nombre** del kit + **descripción**.
- Panel de **"Precio estimado"** en soles.
- Botón **"Solicitar cotización"** → lleva a `/cotizar`.
- **Tres listas**:
  - **Materiales** (nombre + cantidad/unidad).
  - **Herramientas sugeridas** (idem).
  - **Maquinaria sugerida** (idem).
- Cada artículo muestra su nombre y la cantidad con su unidad.

### Interacción del usuario
1. Ve el resumen y precio del kit.
2. Pulsa **"Solicitar cotización"** para avanzar al formulario de cotización.

---

## 2.5 KitObra IA (recomendador) — incluido en `/kits`

**Propósito**: recomendador inteligente que, según el tipo de obra y la medida aproximada, sugiere un kit con materiales (y opcionalmente herramientas/maquinaria). Usa IA (GROQ) con una regla local de respaldo.

### Pasos para usarlo
1. Elige el **tipo de obra** (Falso piso, Tarrajeo, Muro, Vereda o Remodelación menor).
2. Ingresa la **medida aproximada (m²)** (obligatorio).
3. Opcionalmente ingresa el **presupuesto aproximado (S/)**.
4. Marca o desmarca:
   - "Necesito sugerencias de herramientas" (marcado por defecto).
   - "Necesito sugerencias de maquinaria".
5. Escribe **observaciones** (opcional).
6. Pulsa **"Generar recomendación IA"**.

### Resultado de la recomendación
- Chips con el tipo de obra, área y presupuesto.
- **Materiales sugeridos** (editable): puedes **quitar** un material (botón "×"), **ajustar cantidades** con los botones **− / +**, y **agregar productos** del catálogo (botón "+ Agregar producto").
- **Herramientas sugeridas** y **Maquinaria sugerida** (con botón "×" para quitar).
- **Precio estimado** con desglose (no incluye alquiler de maquinaria).
- Si la recomendación supera el presupuesto, aparece un aviso rojo.
- Puedes **"Cotizar kit"** (abre un formulario con nombres, teléfono, email) o **"Volver a generar"**.
- Al cotizar: se registra la cotización y se muestra un código y el estado "nueva".

> **Nota**: Si no hay conexión con la IA (falta la clave `GROQ_API_KEY`), el sistema usa una **recomendación local de demostración** y muestra un aviso ámbar. Los precios en ese caso son referenciales.

---

## 2.6 Maquinaria — `/maquinaria`

**Propósito**: mostrar los **equipos de maquinaria disponibles** para alquiler (RentaMicro) y permitir al cliente **solicitar el alquiler**.

### Elementos
- **Título "Maquinaria"** con etiqueta "WONG · RentaMicro".
- **Rejilla de equipos**: cada tarjeta muestra:
  - Imagen (o dibujo si no tiene).
  - Nombre del equipo.
  - Chip de disponibilidad: **Disponible** (verde) / **No disponible** (rojo).
  - Descripción.
  - **Precio por día**.
  - Botón **"Solicitar"** (solo si está disponible) → lleva al formulario.

### Formulario "Solicitar maquinaria"
- **Maquinaria** (lista desplegable; solo las disponibles).
- **Nombre** (obligatorio).
- **Teléfono** (obligatorio; solo dígitos, de 7 a 15).
- **Fecha inicio** y **Fecha fin** (obligatorias).
- **Observaciones** (opcional).
- Botón **"Solicitar alquiler"**.

### Validaciones
- La fecha fin no puede ser anterior a la fecha inicio.
- El teléfono debe tener entre 7 y 15 dígitos (se permiten espacios y guiones, se eliminan automáticamente).
- Debe seleccionarse una maquinaria disponible.

### Confirmación (tras el envío)
- Se muestra un panel verde con el **código** de la solicitud, cliente, teléfono, equipo, período, total estimado y observaciones.
- Botón **"Enviar por WhatsApp"** → abre WhatsApp con el resumen de la solicitud.
- Botón **"Enviar otra solicitud"** → permite repetir el proceso.

> **Nota**: El precio total estimado = precio por día × número de días. Si la función de solicitud no está configurada en el servidor, aparecerá un mensaje indicando que debe aplicarse una migración SQL en Supabase.

---

## 2.7 Contacto — `/contacto`

**Propósito**: mostrar la información de contacto corporativa y un formulario de mensaje.

### Elementos
- **Título "Contacto"** con etiqueta "WONG · Contacto".
- **Columna "Información de contacto"**:
  - **Teléfono**: enlace que inicia una llamada.
  - **WhatsApp**: enlace que abre el chat de WhatsApp.
  - **Dirección**: Av. Principal 1234, San Isidro, Lima.
  - **Horario**: Lun – Sáb · 8:00 a 18:00.
- **Columna "Formulario de contacto"**: Nombre, Email y Mensaje (obligatorios) + botón **"Enviar mensaje"**.

### Interacción del usuario
- Puede llamar o escribir por WhatsApp desde los enlaces.
- Puede llenar el formulario. **Nota**: actualmente el formulario valida los campos (obligatorios y formato de email) pero **no envía los datos a ningún sitio** (no se persisten). La vía de contacto que sí funciona es por teléfono o WhatsApp.

---

## 2.8 Cotizar — `/cotizar`

**Propósito**: formulario central para que el cliente **solicite una cotización** de su obra. Es la ruta principal de conversión del sitio.

### Elementos del formulario
- **Título "Cotizar mi obra"** con etiqueta "WONG · Cotiza".
- **Nombres** (obligatorio).
- **Apellidos** (obligatorio).
- **Teléfono** (obligatorio; de 9 a 12 dígitos tras quitar espacios/guiones).
- **Email** (opcional; si se llena debe tener formato válido).
- **Tipo de obra** (obligatorio; se listan los tipos de los kits existentes + la opción "Otro").
- **Kit (opcional)**: "Ninguno / no aplica" o algún kit.
- **Descripción de la obra** (obligatorio; describe brevemente el proyecto).
- **Observaciones** (opcional).
- Botón **"Enviar solicitud"**.

### Comportamiento
- Si un campo obligatorio no está lleno o el teléfono es inválido, se muestra el mensaje de error debajo del campo y no se envía.
- Si el cliente **elige un kit**, el sistema carga su resumen (materiales y precio) para incluirlo en el mensaje de WhatsApp.
- Al enviar correctamente:
  - Se muestra la confirmación: "Solicitud de cotización registrada correctamente." con el **código** de la cotización.
  - Botón **"Solicitar por WhatsApp"** → abre WhatsApp con el resumen (cliente, tipo de obra, kit o "Ninguno", materiales del kit, precio, descripción y código).
  - Botón **"Enviar otra solicitud"** → reinicia el formulario.

---

## 2.9 Footer (pie de página)

Presente en todas las páginas públicas. Incluye:

- **Marca + descripción** de la plataforma.
- **Enlaces de navegación** (Inicio, Catálogo, Kits, Maquinaria, Contacto).
- **Contacto**: teléfono (enlace de llamada) y WhatsApp (enlace de chat).
- **Copyright**: "© [año] WONG ObraSmart. Todos los derechos reservados."
