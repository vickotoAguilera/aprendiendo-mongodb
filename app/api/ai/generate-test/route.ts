import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
Eres un creador automático de exámenes prácticos de MongoDB.
El estudiante tiene una Prueba Práctica donde le exigirán demostrar dominio sobre:
1. Crear una Base de datos y una Colección.
2. Crear e Insertar Documentos con subdocumentos y Arreglos de subdocumentos.
3. Actualizar subdocumentos o elementos de un Arreglo (usando $set, $push o $pull).
4. Buscar documentos anidados avanzados (usando la notación de punto).

Debes generar OBLIGATORIAMENTE un JSON estricto que contenga 6 misiones prácticas sucesivas.
La PRIMERA MISIÓN debe ser exactamente el caso de estudio de la clase: "Sistema Tienda en Línea".
Las otras 5 MISIONES deben aplicar exactamente la misma lógica y cantidad de pasos, pero en escenarios de dominio distintos (Ej: Biblioteca, Hospital, Escuela, Banco, Aerolínea).

🚨 REGLA VITAL DE VERIFICACIÓN 🚨
Para que el estudiante esté 100% seguro de que el comando funcionó, CASI TODOS LOS PASOS que involucren crear, modificar o eliminar DEBEN incluir la orden explícita de verificar el cambio usando el comando respectivo (como .find() o .count()).
Ejemplo de una instrucción válida: "Inserta 3 libros de The Beatles usando insertMany y LUEGO verifícalo lanzando db.libros.find() para verlos en tu consola".

DEVUELVE OBLIGATORIAMENTE UN JSON ESTRICTO CON LA SIGUIENTE ESTRUCTURA PLANA:
{
  "title": "Simulador de Prueba Práctica: 6 Misiones de Dominio",
  "steps": [
    { 
      "id": "Misión 1: Tienda - Paso 1", 
      "instruction": "Crea una base de datos llamada 'tienda_online' y dentro de ella crea una colección llamada 'clientes'.", 
      "hint": "Recuerda que el comando 'use' sirve para crear y entrar a bases de datos, y que se utiliza 'db.createCollection()' genéricamente para colecciones." 
    },
    { 
      "id": "Misión 1: Tienda - Paso 2", 
      "instruction": "Crea al menos un cliente usando insertOne. El documento debe tener nombre, email, 'direccion' (con ciudad y pais) y 'pedidos' (que sea un arreglo con producto, cantidad y precio). MUY IMPORTANTE: Una vez insertado, ejecuta db.clientes.find() para verificar que se haya guardado.", 
      "hint": "Para insertar un objeto usa insertOne(). Luego para verificar usa db.coleccion.find()" 
    },
    { 
      "id": "Misión 1: Tienda - Paso 3", 
      "instruction": "Actualiza la dirección de alguno de tus clientes, cambiándole la ciudad y el país. Cuando lo hagas, ejecuta un comando de búsqueda para verificar visualmente los cambios.", 
      "hint": "Para acceder a campos internos desde el filtro y desde el update, usa la notación de punto entre comillas (ej. 'direccion.ciudad'). Recuerda usar el operador $set." 
    },
    { 
      "id": "Misión 1: Tienda - Paso 4", 
      "instruction": "Busca y visualiza a los clientes que vivan en la ciudad que acabas de actualizar.", 
      "hint": "Usa la función find() pasando un objeto de filtro aplicando nuevamente la notación de punto." 
    },
    { "id": "Misión 2: Biblioteca - Paso 1", "instruction": "...", "hint": "..." },
    ... etc ...
  ]
}

REGLAS CRÍTICAS:
- Jamás pongas la solución exacta dentro del "hint", solo sugerencias teóricas o nombres genéricos de funciones.
- No devuelvas ningún texto antes ni después del JSON. Solo llaves puras de JSON.
`;

export async function GET() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const output = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(output);

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Groq Checkpoint Exam Generator Error:", err);
    return NextResponse.json({ error: "El IA falló al crear el examen en tiempo real." }, { status: 500 });
  }
}
