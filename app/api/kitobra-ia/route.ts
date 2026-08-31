import { NextResponse } from "next/server";
import { productos } from "@/data/productos";
import {
  construirRecomendacionIA,
  type ObraDatos,
  type ResultadoIA,
} from "@/lib/kitobra";

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

const catalogoParaPrompt = (): string =>
  productos
    .map((p) => `- ${p.nombre} (${p.unidad}, S/ ${p.precio})`)
    .join("\n");

const extraerJson = (contenido: string): ResultadoIA | null => {
  const limpio = contenido.replace(/```json|```/g, "").trim();
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1) return null;
  try {
    return JSON.parse(limpio.slice(inicio, fin + 1)) as ResultadoIA;
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY no configurada en el servidor." },
      { status: 500 }
    );
  }

  let datos: ObraDatos;
  try {
    const cuerpo = (await request.json()) as Partial<ObraDatos>;
    const area = Number(cuerpo.area);
    if (!cuerpo.tipoObra || !Number.isFinite(area) || area <= 0) {
      return NextResponse.json(
        { error: "Datos inválidos: tipo de obra y área son obligatorios." },
        { status: 400 }
      );
    }
    datos = {
      tipoObra: cuerpo.tipoObra,
      area,
      presupuesto: Number.isFinite(Number(cuerpo.presupuesto))
        ? Number(cuerpo.presupuesto)
        : null,
      necesitaHerramientas: cuerpo.necesitaHerramientas ?? true,
      necesitaMaquinaria: cuerpo.necesitaMaquinaria ?? false,
      observaciones: cuerpo.observaciones ?? "",
    };
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const systemPrompt = [
    "Eres un ingeniero civil experto en micro-obras y acabados de construcción en Perú.",
    "Respondes SOLO con un objeto JSON válido, sin texto adicional, con este esquema:",
    `{
  "alcance": "descripción breve de la obra",
  "materiales": [{ "nombre": "string", "cantidad": número, "unidad": "string" }],
  "herramientas": [{ "nombre": "string" }],
  "maquinaria": [{ "nombre": "string" }],
  "observaciones": "consejos y consideraciones"
}`,
    "Reglas:",
    "- Usa nombres exactos de la lista de productos del catálogo cuando sea aplicable.",
    "- Si un producto no está en el catálogo, indícalo en observaciones.",
    "- Cantidades referenciales para la obra indicada, usando unidades del catálogo.",
    "- Solo incluye herramientas si el cliente las necesita; igual para maquinaria.",
  ].join("\n");

  const userPrompt = [
    "Genera la recomendación con estos datos del cliente:",
    `- Tipo de obra: ${datos.tipoObra}`,
    `- Área aproximada: ${datos.area} m²`,
    datos.presupuesto !== null
      ? `- Presupuesto aproximado: S/ ${datos.presupuesto}`
      : "- Presupuesto aproximado: no especificado",
    `- Necesita sugerencias de herramientas: ${datos.necesitaHerramientas ? "sí" : "no"}`,
    `- Necesita sugerencias de maquinaria: ${datos.necesitaMaquinaria ? "sí" : "no"}`,
    datos.observaciones
      ? `- Observaciones del cliente: ${datos.observaciones}`
      : "",
    "",
    "Catálogo con precios disponibles:",
    catalogoParaPrompt(),
  ]
    .filter((linea) => linea !== "")
    .join("\n");

  try {
    const respuestaGroq = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!respuestaGroq.ok) {
      if (respuestaGroq.status === 429) {
        return NextResponse.json(
          { error: "KitObra IA está sobrecargada (límite de peticiones)." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: `Groq respondió ${respuestaGroq.status}.` },
        { status: 502 }
      );
    }

    const cuerpoGroq = (await respuestaGroq.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const contenido = cuerpoGroq.choices?.[0]?.message?.content;
    if (!contenido) {
      return NextResponse.json(
        { error: "Groq no devolvió contenido." },
        { status: 502 }
      );
    }

    const resultado = extraerJson(contenido);
    if (!resultado) {
      return NextResponse.json(
        { error: "La IA devolvió un JSON inválido." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      recomendacion: construirRecomendacionIA(datos, resultado),
    });
  } catch {
    return NextResponse.json(
      { error: "Error de conexión con KitObra IA." },
      { status: 500 }
    );
  }
}