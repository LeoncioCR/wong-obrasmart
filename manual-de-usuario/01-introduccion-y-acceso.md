# 01 - Introducción y Acceso

## ¿Qué es WONG ObraSmart?

**WONG ObraSmart** es una plataforma inteligente para el abastecimiento de micro-obras. Conecta a los clientes (personas o contratistas que realizan obras pequeñas como falso piso, tarrajeo, muros, veredas o remodelaciones) con los **materiales, kits organizados y maquinaria** que necesitan, de forma rápida y confiable.

La plataforma tiene **dos áreas principales**:

1. **Sitio público (`/`)** — donde los clientes exploran el catálogo, revisan kits de obra, solicitan cotizaciones y alquilan maquinaria.
2. **Panel administrativo (`/dashboard`)** — donde el equipo interno gestiona productos, kits, clientes, cotizaciones, pedidos, maquinaria y alquileres, y analiza el negocio.

---

## Roles de usuario

| Rol | Descripción | Acceso |
|---|---|---|
| **Visitante / Cliente** | Persona que visita el sitio para cotizar o alquilar. | Sitio público (sin login). |
| **Administrador** | Personal autorizado que gestiona la operación. | Panel administrativo (`/dashboard`), requiere iniciar sesión en `/login`. |

---

## Cómo acceder al panel administrativo

1. Entra a la página de acceso en **`/login`** (o haz clic en **"Ingresar"** desde el menú superior del sitio).
2. Ingresa las **credenciales de administrador** (email y contraseña). Por defecto el correo sugerido es `admin@wong.pe`.
3. Pulsa el botón **"Iniciar sesión"**.
4. Si las credenciales son correctas, serás redirigido al **dashboard** (`/dashboard`).

### Mensajes de error de acceso

| Situación | Mensaje mostrado |
|---|---|
| Email o contraseña incorrectos | "Email o contraseña incorrectos." |
| El correo no está confirmado | "El correo aún no ha sido confirmado." |
| Demasiados intentos seguidos | "Demasiados intentos. Inténtalo nuevamente en unos minutos." |

> **Importante**: El acceso al panel está restringido al personal autorizado de WONG ObraSmart.

### Para cerrar sesión

En la esquina superior derecha del panel haz clic en el botón **"Salir"** (o "Cerrando..." mientras procesa). Esto te devuelve al login y cierra tu sesión de forma segura.

---

## Estructura general del panel administrativo

Al entrar al dashboard encontrarás:

- **Barra lateral (menú)**: navegación a todas las secciones (Dashboard, Productos, Categorías, Kits, Clientes, Cotizaciones, Pedidos, Maquinaria, Alquileres y DataObra). En pantallas pequeñas se abre como panel deslizable con el botón de menú.
- **Barra superior**: muestra el título de la sección, un indicador "En línea", un ícono de **notificaciones** y tu perfil (Administrador).
- **Área de contenido**: donde se muestra la sección seleccionada.

### Notificaciones en tiempo real

La campana de notificaciones (icono superior) te avisa cuando se registra una **nueva cotización**:

- Muestra un **contador numérico** sobre la campana (hasta "99+").
- Al hacer clic, despliega un listado de las cotizaciones nuevas (con código, tipo de obra, fecha y estado).
- Cada elemento te lleva al detalle de esa cotización.
- Al final hay un enlace **"Ver todas las cotizaciones"**.
- Además aparece un **aviso emergente** (toast) abajo a la derecha durante unos segundos con el código de la nueva cotización.

---

## Resumen del flujo general del negocio

1. Un **cliente** visita el sitio público, llena un formulario y genera una **cotización** (estado inicial: "nueva").
2. El **administrador** recibe la notificación en tiempo real y revisa la cotización.
3. El administrador va avanzando el estado de la cotización: `nueva → en_revision → cotizada`.
4. Si el **cliente acepta** la propuesta, se cambia el estado a `aceptada`.
5. Desde la sección **Pedidos**, el administrador **convierte** la cotización aceptada en un **pedido** (se copian todos los detalles).
6. El pedido avanza en sus propios estados hasta **entregado**.
7. De forma paralela, si hay **maquinaria** involucrada, se gestionan **alquileres** que avanzan hasta "devuelto".
8. Toda la información se consolida en **DataObra** para el análisis ejecutivo.

> Para conocer a fondo cada etapa y el significado de los estados, consulta el documento [**05 - Flujo del negocio y estados**](./05-flujo-negocio-y-estados.md).
