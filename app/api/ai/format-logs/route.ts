import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { logHistory } = await req.json();

    if (!logHistory) {
      return NextResponse.json({ error: "No se proporcionaron logs." }, { status: 400 });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key de Groq no configurada." }, { status: 500 });
    }

    const systemPrompt = `
Eres un analista de logs de consola experta en MongoDB. Tu trabajo es leer TODO el historial de la terminal provisto, identificar únicamente los comandos que el usuario ejecutó con ÉXITO (ignorando errores de sintaxis, fallos o logs del AI TUTOR) y transformarlos a un archivo limpio.

REGLAS ESTRICTAS:
1. Extrae solo los comandos escritos por el usuario (los que comiencen con > o texto de código).
2. Descarta TODO comando que tenga en su respuesta arroje 'SyntaxError', 'MongoError', o mensajes similares de fallo.
3. Descarta todos los mensajes enviados por "— [AI TUTOR] —".
4. Estructura el archivo final puro texto (Plain Text). NO respondas con Markdown, NO uses acentos invertidos (\`\`\`).
5. El formato debe ser limpio, como un script. Pon el comando que se usó, seguido de su output. Separa cada uno con un salto de línea.
Ejemplo:
> use tiendita
switched to db tiendita

> db.clientes.find()
{ "_id": ObjectId("..."), "nombre": "Juan" }
    `.trim();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Limpia estos logs por favor y prepáralos como script:\n\n${logHistory}` }
        ],
        temperature: 0.1, // Baja temperatura para que sea extremadamente preciso y no invente nada
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Error de conexión con Groq Llama." }, { status: 502 });
    }

    const groqData = await response.json();
    const cleanLogs = groqData.choices?.[0]?.message?.content || "";

    return NextResponse.json({ result: cleanLogs });

  } catch (error: any) {
    console.error("Error formatting logs:", error);
    return NextResponse.json({ error: "Error procesando el requerimiento" }, { status: 500 });
  }
}
