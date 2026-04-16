import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
Eres un Mentor de MongoDB que transforma documentos de texto sin formato en un plan de clase paso a paso (array estructurado) para simulación web interactiva.
Tu meta: Recibes un texto crudo que es un archivo descriptivo de una prueba, examen, o proyecto empresarial en MongoDB. 
Debes leer la intención general, extraer un Título lógico, y luego dividir metódicamente el texto en instrucciones modulares "paso a paso".
Cada paso debe ser una orden accionable que el estudiante pueda resolver en una terminal de Mongo usando 1 o máximo 2 comandos (inserciones, bases de datos, colecciones, aggregates, updates, finds, etc.).
Además, proporciona un "hint" (consejo) de ayuda para cada paso. El hint debe mencionar la estructura del comando o función que debe usar de forma genérica, sin resolverle el ejercicio. Nombra la función para ayudarle a refrescar la memoria.
MAL HINT: "La creación de colecciones se hace con un método de la base de datos." (Muy vago).
MAL HINT: "Usa db.createCollection('productos')." (Le da la respuesta en bandeja).
BUEN HINT: "Para crear una colección recuerda usar la función db.createCollection() pasándole el nombre por parámetro."

DEVUELVE OBLIGATORIAMENTE UN JSON ESTRICTO CON LA SIGUIENTE ESTRUCTURA:
{
  "title": "String, titulo inferido del reto global",
  "steps": [
    { "id": "Paso 1", "instruction": "Instrucción clara, por ej: Cambiate a una BD llamada hospital y crea una coleccion cirugias.", "hint": "Recuerda que el comando 'use' sirve para crear y entrar a bases de datos, y que se utiliza 'db.createCollection()' genéricamente para colecciones." },
    { "id": "Paso 2", "instruction": "...", "hint": "..." }
  ]
}
No devuelvas NADA más que el JSON puro. Sin explicaciones previas ni texto introductorio.
`;

export async function POST(req: Request) {
  try {
    const { documentText } = await req.json();

    if (!documentText || typeof documentText !== "string") {
      return NextResponse.json({ error: "No se proporcionó texto de documento válido." }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `DOCUMENTO CRUDO ESTUDIANTE:\n\n${documentText}` }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const output = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(output);

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Groq Document Parser Error:", err);
    return NextResponse.json({ error: "El procesador IA falló al leer tu documento." }, { status: 500 });
  }
}
