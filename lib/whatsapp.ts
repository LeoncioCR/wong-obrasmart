export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "51900000000";

export function whatsappTelefonoLegible(): string {
  const digitos = WHATSAPP_NUMBER.replace(/\D/g, "");
  const pais = digitos.slice(0, 2);
  const resto = digitos.slice(2);
  return `+${pais} ${resto}`;
}

export function enlaceWhatsapp(mensaje: string): string {
  const texto = mensaje.trim();
  return texto
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/${WHATSAPP_NUMBER}`;
}