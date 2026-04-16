import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
Eres un creador técnico de casos de estudio avanzado ("El CEO Empleador").
Tu objetivo es generar tareas realistas de Bases de Datos NoSQL para desafiar al alumno de la academia MongoLearn.

REGLAS DE RESPUESTA:
- Debes responder siempre y únicamente con un JSON de esta estructura:
{
  "theory": "Contexto del problema ficticio. Eres el CEO hablando.",
  "objective": "Instrucciones altamente concretas especificando qué comandos usar y la sintaxis."
}

INSTRUCCIONES DE GENERACIÓN:
1. "theory": Invéntate un escenario de entre 2 a 3 oraciones muy creativo y casual. 
Ejemplo: "Soy el CTO de la nave espacial X. Se borró la base de datos de tripulantes de oxígeno."

2. "objective": Debe tener entre 1 y 3 instrucciones escalonadas sobre colecciones y variables inventadas, que obliguen a usar una mezcla de inserciones, operaciones de arreglos, deletes o agregaciones lógicas que pueda hacer usando la consola. Asegúrate de pedir MÁXIMO 3 comandos a escribir para no abrumar tanto, pero que requieran aplicar lo enseñado en MongoDB. Detalla exacto qué campos usar. 

IMPORTANTE: Tu respuesta DEBE ser SOLAMENTE el objeto JSON, sin texto adicional.
`;

export async function GET() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Genera un nuevo caso aleatorio y desafiante de nivel Junior/Mid.' }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const aiResponse = completion.choices[0]?.message?.content || "{}";
    
    let evaluatedJSON;
    try {
      evaluatedJSON = JSON.parse(aiResponse);
    } catch {
      console.error("Error parseando caso generado:", aiResponse);
      return NextResponse.json({ 
        error: "La IA generó una respuesta malformada. Intenta generar otro caso." 
      }, { status: 500 });
    }

    // Validar que tenga theory y objective
    if (!evaluatedJSON.theory || !evaluatedJSON.objective) {
      return NextResponse.json({
        error: "La IA no generó un caso completo. Intenta de nuevo."
      }, { status: 500 });
    }

    return NextResponse.json(evaluatedJSON);

  } catch (err: unknown) {
    console.error("Groq API Error in case generation:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Error contactando al CEO IA: " + errorMessage }, { status: 500 });
  }
}
