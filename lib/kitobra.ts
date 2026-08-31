import { productos } from "@/data/productos";

export type TipoObra =
  | "Falso piso"
  | "Tarrajeo"
  | "Muro"
  | "Vereda"
  | "Remodelación menor";

export const tiposObra: TipoObra[] = [
  "Falso piso",
  "Tarrajeo",
  "Muro",
  "Vereda",
  "Remodelación menor",
];

export interface MaterialRecomendado {
  id: string;
  nombre: string;
  descripcion: string | null;
  cantidad: number;
  unidad: string;
  precio: number | null;
}

export interface HerramientaRecomendada {
  id: string;
  nombre: string;
  precio: number | null;
}

export interface MaquinariaRecomendada {
  id: string;
  nombre: string;
  precioDia: number | null;
}

export interface RecomendacionObra {
  tipoObra: string;
  alcance: string;
  area: number;
  materiales: MaterialRecomendado[];
  herramientas: HerramientaRecomendada[];
  maquinaria: MaquinariaRecomendada[];
  precioEstimado: number;
  superaPresupuesto: boolean;
  observaciones: string;
  fuente: "ia" | "local";
}

export interface ObraDatos {
  tipoObra: TipoObra;
  area: number;
  presupuesto: number | null;
  necesitaHerramientas: boolean;
  necesitaMaquinaria: boolean;
  observaciones: string;
}

interface MaterialBase {
  productoId?: string;
  nombre?: string;
  precio?: number;
  unidad?: string;
  cantidadBase: number;
}

interface HerramientaBase {
  productoId?: string;
  nombre?: string;
  precio?: number | null;
}

interface MaquinariaBase {
  productoId?: string;
  nombre?: string;
  precio?: number;
}

interface ConfigTipoObra {
  baseArea: number;
  alcance: string;
  materiales: MaterialBase[];
  herramientas: HerramientaBase[];
  maquinaria: MaquinariaBase[];
}

const redondear = (valor: number): number => Math.round(valor * 100) / 100;

const redondearCantidad = (valor: number): number =>
  Math.round(valor * 10) / 10;

const unidadesEnteras = new Set([
  "unidad",
  "bolsa",
  "varilla",
  "par",
  "día",
  "galón",
]);

const escalarCantidad = (
  base: number,
  factor: number,
  unidad: string
): number => {
  const valor = redondearCantidad(base * factor);
  if (unidadesEnteras.has(unidad)) return Math.max(1, Math.round(valor));
  return Math.max(0.5, valor);
};

const slug = (nombre: string): string =>
  nombre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const configPorTipo: Record<TipoObra, ConfigTipoObra> = {
  "Falso piso": {
    baseArea: 15,
    alcance: "Para ~15 m² de falso piso, incluye nivelación de la base.",
    materiales: [
      { productoId: "prod-001", cantidadBase: 9 },
      { productoId: "prod-002", cantidadBase: 1.2 },
      { nombre: "Piedra chancada", precio: 150, unidad: "m3", cantidadBase: 1.8 },
      { nombre: "Curador de concreto", precio: 45, unidad: "gal", cantidadBase: 1 },
    ],
    herramientas: [
      { productoId: "prod-012" },
      { productoId: "prod-013" },
      { nombre: "Wincha" },
      { nombre: "Nivel de burbuja" },
    ],
    maquinaria: [{ productoId: "prod-009" }, { productoId: "prod-011" }],
  },
  Tarrajeo: {
    baseArea: 25,
    alcance: "Para tarrajeo liso de ~25 m² de muros interiores.",
    materiales: [
      { productoId: "prod-001", cantidadBase: 6 },
      { nombre: "Arena fina", precio: 90, unidad: "m3", cantidadBase: 0.8 },
      { nombre: "Yeso (bolsa 20 kg)", precio: 22, unidad: "bolsa", cantidadBase: 3 },
    ],
    herramientas: [
      { nombre: "Paleta de tarrajeo" },
      { nombre: "Fratacho" },
      { nombre: "Batidor" },
    ],
    maquinaria: [{ productoId: "prod-009" }],
  },
  Muro: {
    baseArea: 15,
    alcance: "Para ~15 m² de muro de soga (≈6 ml de 2.6 m de alto).",
    materiales: [
      { productoId: "prod-003", cantidadBase: 360 },
      { productoId: "prod-001", cantidadBase: 18 },
      { productoId: "prod-002", cantidadBase: 1.8 },
    ],
    herramientas: [
      { productoId: "prod-012" },
      { productoId: "prod-013" },
      { nombre: "Plomada" },
      { nombre: "Nivel de mano" },
    ],
    maquinaria: [{ productoId: "prod-009" }],
  },
  Vereda: {
    baseArea: 10,
    alcance: "Para ~10 m² de vereda con sardineles y refuerzo con fierro.",
    materiales: [
      { productoId: "prod-001", cantidadBase: 12 },
      { productoId: "prod-002", cantidadBase: 1.2 },
      { nombre: "Piedra chancada", precio: 150, unidad: "m3", cantidadBase: 2 },
      { productoId: "prod-004", cantidadBase: 8 },
    ],
    herramientas: [
      { productoId: "prod-012" },
      { productoId: "prod-013" },
      { nombre: "Wincha" },
      { nombre: "Nivel de burbuja" },
    ],
    maquinaria: [{ productoId: "prod-009" }, { productoId: "prod-010" }],
  },
  "Remodelación menor": {
    baseArea: 15,
    alcance: "Para la remodelación de un ambiente de ~15 m².",
    materiales: [
      { productoId: "prod-014", cantidadBase: 1 },
      { productoId: "prod-015", cantidadBase: 1 },
      { productoId: "prod-001", cantidadBase: 4 },
      { productoId: "prod-016", cantidadBase: 4 },
      { productoId: "prod-017", cantidadBase: 8 },
    ],
    herramientas: [{ nombre: "Brocha y rodillo" }, { nombre: "Espátula y lija" }],
    maquinaria: [],
  },
};

const resolverMaterial = (m: MaterialBase): MaterialRecomendado => {
  if (m.productoId) {
    const producto = productos.find((p) => p.id === m.productoId);
    if (producto) {
      return {
        id: m.productoId,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        cantidad: 0,
        unidad: producto.unidad,
        precio: producto.precio,
      };
    }
  }
  return {
    id: slug(m.nombre ?? "material"),
    nombre: m.nombre ?? "Material",
    descripcion: null,
    cantidad: 0,
    unidad: m.unidad ?? "unidad",
    precio: m.precio ?? null,
  };
};

const resolverHerramienta = (h: HerramientaBase): HerramientaRecomendada => {
  if (h.productoId) {
    const producto = productos.find((p) => p.id === h.productoId);
    if (producto) {
      return { id: h.productoId, nombre: producto.nombre, precio: producto.precio };
    }
  }
  return {
    id: slug(h.nombre ?? "herramienta"),
    nombre: h.nombre ?? "Herramienta",
    precio: h.precio ?? null,
  };
};

const resolverMaquinaria = (mq: MaquinariaBase): MaquinariaRecomendada => {
  if (mq.productoId) {
    const producto = productos.find((p) => p.id === mq.productoId);
    if (producto) {
      return { id: mq.productoId, nombre: producto.nombre, precioDia: producto.precio };
    }
  }
  return {
    id: slug(mq.nombre ?? "equipo"),
    nombre: mq.nombre ?? "Equipo",
    precioDia: mq.precio ?? null,
  };
};

const recomendarIA = (datos: ObraDatos): RecomendacionObra => {
  const config = configPorTipo[datos.tipoObra];
  const factor = datos.area / config.baseArea;

  const materiales: MaterialRecomendado[] = config.materiales.map((m) => {
    const base = resolverMaterial(m);
    return {
      ...base,
      cantidad: escalarCantidad(m.cantidadBase, factor, base.unidad),
    };
  });

  const herramientas: HerramientaRecomendada[] = datos.necesitaHerramientas
    ? config.herramientas.map(resolverHerramienta)
    : [];

  const maquinaria: MaquinariaRecomendada[] = datos.necesitaMaquinaria
    ? config.maquinaria.map(resolverMaquinaria)
    : [];

  const precioMateriales = materiales.reduce(
    (suma, m) => suma + (m.precio ?? 0) * m.cantidad,
    0
  );
  const precioHerramientas = herramientas.reduce(
    (suma, h) => suma + (h.precio ?? 0),
    0
  );
  const precioEstimado = redondear(precioMateriales + precioHerramientas);

  return {
    tipoObra: datos.tipoObra,
    alcance: config.alcance,
    area: datos.area,
    materiales,
    herramientas,
    maquinaria,
    precioEstimado,
    superaPresupuesto:
      datos.presupuesto !== null && precioEstimado > datos.presupuesto,
    observaciones: datos.observaciones,
    fuente: "local",
  };
};

export interface ResultadoIA {
  alcance?: string;
  materiales?: { nombre?: string; cantidad?: number; unidad?: string }[];
  herramientas?: { nombre?: string }[];
  maquinaria?: { nombre?: string }[];
  observaciones?: string;
}

const normalizarTexto = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const buscarProducto = (nombre: string) => {
  const objetivo = normalizarTexto(nombre);
  return (
    productos.find((p) => normalizarTexto(p.nombre).includes(objetivo)) ??
    productos.find((p) => objetivo.includes(normalizarTexto(p.nombre)))
  );
};

export const construirRecomendacionIA = (
  datos: ObraDatos,
  resultado: ResultadoIA
): RecomendacionObra => {
  const config = configPorTipo[datos.tipoObra];

  const materiales: MaterialRecomendado[] = (resultado.materiales ?? [])
    .map((item) => {
      const nombre = (item.nombre ?? "").trim();
      if (!nombre) return null;
      const producto = buscarProducto(nombre);
      const cantidad = Math.max(
        0.5,
        redondearCantidad(
          Number.isFinite(Number(item.cantidad)) && Number(item.cantidad) > 0
            ? Number(item.cantidad)
            : 1
        )
      );
      return {
        id: producto?.id ?? slug(nombre),
        nombre: producto?.nombre ?? nombre,
        descripcion: producto?.descripcion ?? null,
        cantidad,
        unidad: producto?.unidad ?? (item.unidad?.trim() || "unidad"),
        precio: producto?.precio ?? null,
      };
    })
    .filter((m): m is MaterialRecomendado => m !== null);

  const herramientas: HerramientaRecomendada[] = (resultado.herramientas ?? [])
    .map((item) => {
      const nombre = (item.nombre ?? "").trim();
      if (!nombre) return null;
      const producto = buscarProducto(nombre);
      return {
        id: producto?.id ?? slug(nombre),
        nombre: producto?.nombre ?? nombre,
        precio: producto?.precio ?? null,
      };
    })
    .filter((h): h is HerramientaRecomendada => h !== null);

  const maquinaria: MaquinariaRecomendada[] = (resultado.maquinaria ?? [])
    .map((item) => {
      const nombre = (item.nombre ?? "").trim();
      if (!nombre) return null;
      const producto = buscarProducto(nombre);
      return {
        id: producto?.id ?? slug(nombre),
        nombre: producto?.nombre ?? nombre,
        precioDia: producto?.precio ?? null,
      };
    })
    .filter((mq): mq is MaquinariaRecomendada => mq !== null);

  const precioMateriales = materiales.reduce(
    (suma, m) => suma + (m.precio ?? 0) * m.cantidad,
    0
  );
  const precioHerramientas = herramientas.reduce(
    (suma, h) => suma + (h.precio ?? 0),
    0
  );
  const precioEstimado = redondear(precioMateriales + precioHerramientas);

  return {
    tipoObra: datos.tipoObra,
    alcance: resultado.alcance?.trim() || config.alcance,
    area: datos.area,
    materiales,
    herramientas,
    maquinaria,
    precioEstimado,
    superaPresupuesto:
      datos.presupuesto !== null && precioEstimado > datos.presupuesto,
    observaciones: resultado.observaciones?.trim() || datos.observaciones,
    fuente: "ia",
  };
};

export const obtenerRecomendacion = async (
  datos: ObraDatos
): Promise<RecomendacionObra> => {
  // Punto de conexión real: API Route server-side que llama a Groq (GROQ_API_KEY).
  // Si falla, se cae a una recomendación referencial local para no romper el flujo.
  try {
    const respuesta = await fetch("/api/kitobra-ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!respuesta.ok) throw new Error("KitObra IA no respondió correctamente");
    const json = (await respuesta.json()) as {
      recomendacion?: RecomendacionObra;
    };
    if (!json.recomendacion) throw new Error("Respuesta IA inválida");
    return json.recomendacion;
  } catch {
    return recomendarIA(datos);
  }
};