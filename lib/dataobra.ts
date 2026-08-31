import { productos } from "@/data/productos";

export interface TopItem {
  nombre: string;
  total: number;
}

export interface ClienteFrecuente {
  nombre: string;
  cotizaciones: number;
  pedidos: number;
  ultimaActividad: string;
}

export interface ProductoAlerta {
  id: string;
  nombre: string;
  stock: number;
  unidad: string;
  estado: string;
}

export interface DatosDataObra {
  totalCotizaciones: number;
  aceptadas: number;
  rechazadas: number;
  totalPedidos: number;
  topProductos: TopItem[];
  topKits: TopItem[];
  clientesFrecuentes: ClienteFrecuente[];
  productosBajoStock: ProductoAlerta[];
  productosFaltantes: ProductoAlerta[];
}

const topProductos: TopItem[] = [
  { nombre: "Cemento Portland Tipo I (42.5 kg)", total: 1240 },
  { nombre: "Ladrillo King Kong 18 huecos", total: 980 },
  { nombre: "Arena gruesa", total: 860 },
  { nombre: 'Fierro corrugado 1/2" (9 m)', total: 640 },
  { nombre: "Pintura látex blanco (4 gal)", total: 320 },
];

const topKits: TopItem[] = [
  { nombre: "Muro", total: 64 },
  { nombre: "Falso piso", total: 51 },
  { nombre: "Tarrajeo", total: 43 },
  { nombre: "Vereda", total: 27 },
  { nombre: "Remodelación menor", total: 19 },
];

const clientesFrecuentes: ClienteFrecuente[] = [
  { nombre: "María López", cotizaciones: 6, pedidos: 4, ultimaActividad: "Hoy" },
  { nombre: "José Ramírez", cotizaciones: 5, pedidos: 3, ultimaActividad: "Ayer" },
  { nombre: "Ana Torres", cotizaciones: 4, pedidos: 3, ultimaActividad: "12 ago" },
  { nombre: "Carlos Núñez", cotizaciones: 4, pedidos: 2, ultimaActividad: "9 ago" },
  { nombre: "Lucía Fernández", cotizaciones: 3, pedidos: 2, ultimaActividad: "5 ago" },
];

const convertirProducto = (p: (typeof productos)[number]): ProductoAlerta => ({
  id: p.id,
  nombre: p.nombre,
  stock: p.stock,
  unidad: p.unidad,
  estado: p.estado,
});

const productosBajoStock: ProductoAlerta[] = productos
  .filter((p) => p.stock > 0 && (p.estado === "bajo stock" || p.stock <= 10))
  .map(convertirProducto)
  .sort((a, b) => a.stock - b.stock);

const productosFaltantes: ProductoAlerta[] = productos
  .filter((p) => p.stock === 0 || p.estado === "agotado")
  .map(convertirProducto);

export const datosDataObra: DatosDataObra = {
  totalCotizaciones: 138,
  aceptadas: 92,
  rechazadas: 21,
  totalPedidos: 91,
  topProductos,
  topKits,
  clientesFrecuentes,
  productosBajoStock,
  productosFaltantes,
};