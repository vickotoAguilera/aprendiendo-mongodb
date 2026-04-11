import { NextResponse } from 'next/server';
import Groq from 'groq-sdk'; // El SDK (Software Development Kit) oficial de Groq para Node.js

// Inicializa el cliente conectandose con la llave segura alojada en .env.local
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// El 'System Prompt' es la instruccion raiz o personalidad base que acata Llama 3.
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

### TU LOGICA:
Se te pasara el contexto del Modulo y Leccion Actual (incluyendo el Objetivo que debe cumplir el estudiante) y todo el HISTORIAL DE LOGS de su consola MongoDB real.
1. Saluda de forma amable y profesional si notas que es el inicio de la conversacion (o se muy alentador en tus respuestas).
2. Analiza los Logs. No importa si los logs tienen errores previos, fijate en los ULTIMOS comandos ejecutados.
3. Evalua ESTRICTAMENTE si en los logs el usuario logro ejecutar un comando que cumpla el "Objetivo" de la leccion actual con exito (basandote en el output devuelto por MongoDB).
4. Si el objetivo NO FUE LOGRADO o hay un error de sintaxis:
   - "isSuccess": false
   - "advance": false
   - "message": "Tu explicacion de por que fallo basandote en los logs. Dale una pista de que operador o comando usar (ej. recuerda el $set), pero NUNCA le escribas el comando literal que debe tipear."
5. Si el objetivo FUE LOGRADO:
   - "isSuccess": true
   - "advance": true
   - "message": "Exito! [Opcional: explicale un breve caso de por que esto sirve en trabajos reales como bancos o clinicas]. Continuemos!"
`;

// Esta API es llamada usando fetch('/api/ai/evaluate', { method: 'POST' ... }) desde 'page.tsx' al presionar el boton Verificar
export async function POST(req: Request) {
  try {
    // 1. Extraer los datos enviados en el Body (cuerpo) de la peticion del frontend
    const { currentModule, currentLesson, logHistory } = await req.json();

    // 2. Construir el 'User Prompt' o el contexto final inyectando las variables reales dentro del texto
    const userPromptContext = `
MODULO ACTUAL: ${currentModule?.title || "Desconocido"}
LECCION ACTUAL: ${currentLesson?.title || "Desconocida"}
OBJETIVO QUE EL ESTUDIANTE DEBE CUMPLIR AHORA MISMO: ${currentLesson?.objective || "Ninguno"}

HISTORIAL DE LOGS COMPLETOS DE LA TERMINAL DEL USUARIO:
=========================================
${logHistory}
=========================================

EVALUA: Cumplio el usuario exitosamente el Objetivo basandote en el historial de logs arriba mostrado? 
Responde obligatoriamente en JSON con isSuccess, message y advance.
    `;

    // 3. Ejecutar la llamada asincrona a GroqCloud enviandole la personalidad y los datos armados
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPromptContext }
      ],
      model: 'llama-3.3-70b-versatile', // Modelo rapido y poderoso
      response_format: { type: "json_object" }, // FORZAMOS a que Groq responda solo en lenguaje maquina (JSON) y no un texto libre
      temperature: 0.7, // Creatividad al 70%
    });

    // 4. Recepcion de respuesta. Si vino vacio por un crasheo ponemos un json en blanco
    const aiResponse = completion.choices[0]?.message?.content || "{}";
    
    // 5. Convertir la respuesta string texto plano al formato Objeto Javascript real
    const evaluatedJSON = JSON.parse(aiResponse);

    // 6. Devolverle la informacion procesada a la pantalla principal visual de React
    return NextResponse.json(evaluatedJSON);

  } catch (err: any) {
    console.error("Groq API Error:", err);
    return NextResponse.json({ error: "No pude conectar con el cerebro de IA para validar. Error: " + err.message }, { status: 500 });
  }
}
