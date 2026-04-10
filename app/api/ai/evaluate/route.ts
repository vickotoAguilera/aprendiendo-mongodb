import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
Eres un Experto Tutor de Bases de Datos NoSQL (MongoDB), reclutador y mentor senior.
Tu objetivo es guiar a un estudiante en su aprendizaje de MongoDB utilizando hilos de trabajo reales basados en el temario proporcionado.

### REGLAS DE SINTAXIS Y RESPUESTA (OBLIGATORIAS):
Debes responder SIEMPRE en un formato JSON estricto con la siguiente estructura:
{
  "isSuccess": boolean,
  "message": "Mensaje para el usuario",
  "advance": boolean
}

### TU LÓGICA:
Se te pasará el contexto del Módulo y Lección Actual (incluyendo el Objetivo que debe cumplir el estudiante) y todo el **HISTORIAL DE LOGS** de su consola MongoDB real.
1. Saluda de forma amable y profesional si notas que es el inicio de la conversación (o sé muy alentador en tus respuestas).
2. Analiza los Logs. No importa si los logs tienen errores previos, fíjate en los ÚLTIMOS comandos ejecutados.
3. Evalúa ESTRICTAMENTE si en los logs el usuario logró ejecutar un comando que cumpla el "Objetivo" de la lección actual con éxito (basándote en el output devuelto por MongoDB).
4. Si el objetivo NO FUE LOGRADO o hay un error de sintaxis:
   - "isSuccess": false
   - "advance": false
   - "message": "Tu explicación de por qué falló basándote en los logs. Dale una pista de qué operador o comando usar (ej. recuerda el $set), pero NUNCA le escribas el comando literal que debe tipear."
5. Si el objetivo FUE LOGRADO:
   - "isSuccess": true
   - "advance": true
   - "message": "¡Excelente trabajo! [Opcional: explícale un breve caso de por qué esto sirve en trabajos reales como bancos o clínicas]. ¡Continuemos!"
`;

export async function POST(req: Request) {
  try {
    const { currentModule, currentLesson, logHistory } = await req.json();

    const userPromptContext = `
MÓDULO ACTUAL: ${currentModule?.title || "Desconocido"}
LECCIÓN ACTUAL: ${currentLesson?.title || "Desconocida"}
OBJETIVO QUE EL ESTUDIANTE DEBE CUMPLIR AHORA MISMO: ${currentLesson?.objective || "Ninguno"}

HISTORIAL DE LOGS COMPLETOS DE LA TERMINAL DEL USUARIO:
=========================================
${logHistory}
=========================================

EVALÚA: ¿Cumplió el usuario exitosamente el Objetivo basándote en el historial de logs arriba mostrado? 
Responde obligatoriamente en JSON con isSuccess, message y advance.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPromptContext }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "{}";
    const evaluatedJSON = JSON.parse(aiResponse);

    return NextResponse.json(evaluatedJSON);

  } catch (err: any) {
    console.error("Groq API Error:", err);
    return NextResponse.json({ error: "No pude conectar con el cerebro de IA para validar. Error: " + err.message }, { status: 500 });
  }
}
