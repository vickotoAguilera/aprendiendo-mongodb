import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
Eres un Asistente Auxiliar ("El Tutor") de la academia MongoLearn.
Tu objetivo es ayudar rápidamente al alumno devolviéndole la estructura o recordando el comando exacto que necesita en MongoDB.

REGLAS DE RESPUESTA:
- Responde siempre muy corto (1 a 3 líneas exageradamente).
- Jamás divagues ni saludes, da la respuesta directa y cruda al punto.
- Debes entregar un ejemplo de la sintaxis y OBLIGATORIAMENTE DEBES REMARCARLO O ENCERRARLO en bloques de código markdown \`codigo\` para que al alumno le sea ultra fácil copiar y pegar en la consola.
`;

export async function POST(req: Request) {
  try {
    const { question, messages } = await req.json();

    if (!question && (!messages || messages.length === 0)) {
       return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const chatContext = messages && messages.length > 0
      ? [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
      : [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: question }];

    const completion = await groq.chat.completions.create({
      messages: chatContext as any,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });

    const aiResponse = completion.choices[0]?.message?.content || "El tutor no pudo responder.";
    return NextResponse.json({ message: aiResponse });

  } catch (err: unknown) {
    console.error("Groq API Error in generic help:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
