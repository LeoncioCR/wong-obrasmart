export interface MaquinariaDisponible {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioDia: number;
  disponible: boolean;
  imagen: string | null;
}

export interface MaquinariaFila {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_dia: number;
  disponible: boolean;
  imagen: string | null;
}

export const convertirMaquinaria = (
  fila: MaquinariaFila
): MaquinariaDisponible => ({
  id: fila.id,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  precioDia: fila.precio_dia,
  disponible: fila.disponible,
  imagen: fila.imagen,
});

export const calcularDias = (inicio: string, fin: string): number =>
  Math.max(
    Math.round(
      (new Date(`${fin}T00:00:00`).getTime() -
        new Date(`${inicio}T00:00:00`).getTime()) /
        86400000
    ) + 1,
    1
  );

export const totalAlquiler = (
  precioDia: number,
  inicio: string,
  fin: string
): number => precioDia * calcularDias(inicio, fin);