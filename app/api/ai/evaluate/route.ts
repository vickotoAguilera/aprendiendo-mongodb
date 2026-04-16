import { NextResponse } from 'next/server';
import Groq from 'groq-sdk'; // Aquí importé el SDK oficial de Groq para poder conectar con Llama 3

// Inicializo el cliente usando la variable de entorno para no exponer mi API Key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Este es el 'System Prompt', básicamente el cerebro de mi configuración.
// Acá le doy la personalidad estricta de "Tutor Senior de MongoDB" para que no se salga de su papel.
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

IMPORTANTE: 
- Tu respuesta DEBE ser SOLAMENTE el objeto JSON, sin texto adicional antes o después.
- Si los logs están vacíos o no contienen comandos relevantes, indica que el usuario no ha ejecutado ningún comando todavía.
`;

// Mi ruta principal de evaluación, acá llega todo lo que el alumno presiona en "Verificar"
export async function POST(req: Request) {
  try {
    // 1. Extraigo los datos que mandé desde mi frontend (el módulo, lección e historial de la terminal)
    const { currentModule, currentLesson, logHistory } = await req.json();

    // Hice esta validación rápida para no quemar tokens a lo tonto si la consola está vacía
    if (!logHistory || logHistory.trim().length === 0) {
      return NextResponse.json({
        isSuccess: false,
        advance: false,
        message: "No has ejecutado ningún comando todavía. Escribe tu comando en la consola y luego presiona 'Verificar con IA'."
      });
    }

    // 2. Construyo el contexto final inyectando las variables del curso antes de ir a Groq
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

    // 3. Llamada asíncrona a la nube de Groq
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPromptContext }
      ],
      model: 'llama-3.3-70b-versatile', // Elegí este modelo porque me rinde bastante bien y es veloz
      response_format: { type: "json_object" }, // FORZO a que Groq responda solo en JSON, me evita muchos dolores de cabeza
      temperature: 0.7, 
    });

    // 4. Recepción de respuesta segura
    const aiResponse = completion.choices[0]?.message?.content || "{}";
    
    // 5. Transformo el JSON string a un objeto usable. 
    // Metí un try-catch por si la IA alucina y me devuelve HTML o basura
    let evaluatedJSON;
    try {
      evaluatedJSON = JSON.parse(aiResponse);
    } catch {
      console.error("Error parseando respuesta IA:", aiResponse);
      // Si el JSON viene malformado, intentamos extraer un mensaje útil
      return NextResponse.json({
        isSuccess: false,
        advance: false,
        message: "El Tutor IA tuvo un problema al formular su respuesta. Intenta verificar de nuevo."
      });
    }

    // 6. Validar que la respuesta tenga la estructura esperada
    if (typeof evaluatedJSON.isSuccess !== "boolean") {
      // La IA respondió JSON pero sin la estructura correcta
      return NextResponse.json({
        isSuccess: false,
        advance: false,
        message: evaluatedJSON.message || evaluatedJSON.feedback || "El Tutor no pudo evaluar correctamente. Intenta de nuevo."
      });
    }

    // 7. Devolverle la informacion procesada a la pantalla principal visual de React
    return NextResponse.json({
      isSuccess: evaluatedJSON.isSuccess,
      advance: evaluatedJSON.advance ?? evaluatedJSON.isSuccess,
      message: evaluatedJSON.message || (evaluatedJSON.isSuccess ? "¡Objetivo cumplido!" : "Revisa tu comando e intenta de nuevo.")
    });

  } catch (err: unknown) {
    console.error("Groq API Error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "No pude conectar con el cerebro de IA para validar. Error: " + errorMessage }, { status: 500 });
  }
}
