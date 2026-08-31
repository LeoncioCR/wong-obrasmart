export type ProductoEstado = "disponible" | "bajo stock" | "agotado";

export type Categoria = "materiales" | "kits" | "maquinaria";

export type Subcategoria =
  | "cemento"
  | "agregados"
  | "ladrillos"
  | "fierro"
  | "herramientas"
  | "pintura"
  | "tuberias";

export interface Producto {
  id: string;
  nombre: string;
  categoria: Categoria;
  subcategoria: Subcategoria;
  descripcion: string;
  precio: number;
  unidad: string;
  stock: number;
  imagen: string;
  estado: ProductoEstado;
}

export const productos: Producto[] = [
  {
    id: "prod-001",
    nombre: "Cemento Portland Tipo I (42.5 kg)",
    categoria: "materiales",
    subcategoria: "cemento",
    descripcion:
      "Cemento de uso general para concreto, muros y elementos de albañilería.",
    precio: 32.5,
    unidad: "bolsa",
    stock: 120,
    imagen: "/productos/cemento-portland.png",
    estado: "disponible",
  },
  {
    id: "prod-002",
    nombre: "Arena gruesa",
    categoria: "materiales",
    subcategoria: "agregados",
    descripcion:
      "Agregado fino lavado para mezclas de concreto y tarrajeo.",
    precio: 85,
    unidad: "m3",
    stock: 40,
    imagen: "/productos/arena-gruesa.png",
    estado: "disponible",
  },
  {
    id: "prod-003",
    nombre: "Ladrillo King Kong 18 huecos",
    categoria: "materiales",
    subcategoria: "ladrillos",
    descripcion:
      "Ladrillo de arcilla para muros portantes y tabiques.",
    precio: 1.2,
    unidad: "unidad",
    stock: 5000,
    imagen: "/productos/ladrillo-kingkong.png",
    estado: "disponible",
  },
  {
    id: "prod-004",
    nombre: "Fierro corrugado 1/2\" (9 m)",
    categoria: "materiales",
    subcategoria: "fierro",
    descripcion:
      "Varilla de acero corrugado grado 60 para refuerzo estructural.",
    precio: 48,
    unidad: "varilla",
    stock: 0,
    imagen: "/productos/fierro-corrugado.png",
    estado: "agotado",
  },
  {
    id: "prod-005",
    nombre: "Kit Falso piso",
    categoria: "kits",
    subcategoria: "agregados",
    descripcion:
      "Cemento, arena y afirmado para preparar una base nivelada de falso piso.",
    precio: 420,
    unidad: "kit",
    stock: 25,
    imagen: "/productos/kit-falso-piso.png",
    estado: "disponible",
  },
  {
    id: "prod-006",
    nombre: "Kit Tarrajeo",
    categoria: "kits",
    subcategoria: "agregados",
    descripcion:
      "Materiales para tarrajeo liso de muros: arena fina, cemento y herramientas básicas.",
    precio: 380,
    unidad: "kit",
    stock: 18,
    imagen: "/productos/kit-tarrajeo.png",
    estado: "bajo stock",
  },
  {
    id: "prod-007",
    nombre: "Kit Muro",
    categoria: "kits",
    subcategoria: "ladrillos",
    descripcion:
      "Ladrillos, cemento y arena para levantar muros resistentes.",
    precio: 560,
    unidad: "kit",
    stock: 30,
    imagen: "/productos/kit-muro.png",
    estado: "disponible",
  },
  {
    id: "prod-008",
    nombre: "Kit Vereda",
    categoria: "kits",
    subcategoria: "agregados",
    descripcion:
      "Concreto, encofrado y refuerzos para veredas y sardineles.",
    precio: 640,
    unidad: "kit",
    stock: 12,
    imagen: "/productos/kit-vereda.png",
    estado: "disponible",
  },
  {
    id: "prod-009",
    nombre: "Mezcladora de concreto 9 p3",
    categoria: "maquinaria",
    subcategoria: "herramientas",
    descripcion:
      "Mezcladora eléctrica de concreto para obras pequeñas y medianas.",
    precio: 65,
    unidad: "día",
    stock: 8,
    imagen: "/productos/mezcladora-concreto.png",
    estado: "disponible",
  },
  {
    id: "prod-010",
    nombre: "Vibrador de concreto",
    categoria: "maquinaria",
    subcategoria: "herramientas",
    descripcion:
      "Equipo de vibrado para compactar concreto en estructuras.",
    precio: 45,
    unidad: "día",
    stock: 0,
    imagen: "/productos/vibrador-concreto.png",
    estado: "agotado",
  },
  {
    id: "prod-011",
    nombre: "Regla vibratoria 3 m",
    categoria: "maquinaria",
    subcategoria: "herramientas",
    descripcion:
      "Regla vibratoria para nivelar y alisar losas de concreto.",
    precio: 55,
    unidad: "día",
    stock: 6,
    imagen: "/productos/regla-vibratoria.png",
    estado: "bajo stock",
  },
  {
    id: "prod-012",
    nombre: "Carretilla de obra 60 L",
    categoria: "materiales",
    subcategoria: "herramientas",
    descripcion:
      "Carretilla reforzada para el transporte de mezclas y materiales en obra.",
    precio: 95,
    unidad: "unidad",
    stock: 15,
    imagen: "/productos/carretilla-obra.png",
    estado: "disponible",
  },
  {
    id: "prod-013",
    nombre: "Lampa y barreta (par)",
    categoria: "materiales",
    subcategoria: "herramientas",
    descripcion:
      "Herramientas manuales de acero para excavación y preparación de mezclas.",
    precio: 35,
    unidad: "par",
    stock: 40,
    imagen: "/productos/lampar-barreta.png",
    estado: "disponible",
  },
  {
    id: "prod-014",
    nombre: "Pintura látex blanco (4 gal)",
    categoria: "materiales",
    subcategoria: "pintura",
    descripcion:
      "Pintura látex lavable para muros interiores y exteriores.",
    precio: 210,
    unidad: "balde",
    stock: 22,
    imagen: "/productos/pintura-latex.png",
    estado: "disponible",
  },
  {
    id: "prod-015",
    nombre: "Imprimante para muros (1 gal)",
    categoria: "materiales",
    subcategoria: "pintura",
    descripcion:
      "Sellador e imprimante para preparar superficies antes de pintar.",
    precio: 55,
    unidad: "galón",
    stock: 18,
    imagen: "/productos/imprimante-muros.png",
    estado: "bajo stock",
  },
  {
    id: "prod-016",
    nombre: "Tubería PVC presión 1/2\" (3 m)",
    categoria: "materiales",
    subcategoria: "tuberias",
    descripcion:
      "Tubería PVC para instalaciones de agua fría y riego.",
    precio: 18,
    unidad: "unidad",
    stock: 60,
    imagen: "/productos/tuberia-pvc.png",
    estado: "disponible",
  },
  {
    id: "prod-017",
    nombre: "Codo PVC 1/2\"",
    categoria: "materiales",
    subcategoria: "tuberias",
    descripcion:
      "Accesorio de 90° para cambios de dirección en tuberías de agua.",
    precio: 3.5,
    unidad: "unidad",
    stock: 200,
    imagen: "/productos/codo-pvc.png",
    estado: "disponible",
  },
];