import { NextResponse } from 'next/server';
import { getSystemState, updateSystemState } from '@/lib/db';
import { exec } from 'child_process'; 
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    // 1. Recibo el comando que el alumno escribió en el frontend
    const { command } = await req.json();
    
    // 2. Traigo mi estado local para recordar en qué base de datos está parado el usuario (el famoso "use db")
    const systemState = await getSystemState();

    let output = "";
    const cmdStr = command.trim();

    // 3. Comandos interceptados: Si manda limpiar pantalla, le aviso al front sin tocar la BD real
    if (cmdStr.toLowerCase() === 'cls' || cmdStr.toLowerCase() === 'clear') {
      return NextResponse.json({ output: "", systemState });
    }

    // 4. Comando 'use' artificial: MongoDB Shell nativo no persiste el "use" entre llamadas aisladas,
    // así que si el usuario escribe "use empresa", lo guardo en mi DB local para recordarlo en la siguiente petición.
    if (cmdStr.toLowerCase().startsWith('use ')) {
      const dbName = cmdStr.split(' ')[1];
      await updateSystemState({ activeDb: dbName });
      output = `switched to db ${dbName}`;
      return NextResponse.json({ output, systemState: await getSystemState() });
    }

    // 5. El núcleo del sistema: Aquí es donde ejecuto el comando
    try {
      // Me conecto directo a la BD activa que tengo guardada en estado
      const activeDb = systemState.activeDb || "test";
      const connectionString = `mongodb://127.0.0.1:27017/${activeDb}`;
      
      // Limpieza brutal: 
      // 1. Eliminamos comentarios de doble diagonal para que al aplanar la línea no comente el resto del código
      let safeCmdStr = cmdStr.replace(/\/\/.*$/gm, '');
      // 2. Aplastamos todos los saltos de línea a espacios para engañar a CMD
      safeCmdStr = safeCmdStr.replace(/\r?\n/g, ' ');
      // 3. Escapamos comillas dobles para que el comando eval de Windows no crashee
      safeCmdStr = safeCmdStr.replace(/"/g, '\\"');
      
      let stdout = "";
      let stderr = "";
      try {
        const result = await execPromise(`mongosh "${connectionString}" --quiet --eval "${safeCmdStr}"`);
        stdout = result.stdout;
        stderr = result.stderr;
      } catch(e: any) {
        stderr = e.message || "Error al ejecutar el script";
      }
      
      output = stdout || stderr;
      
      // Limpio los saltos de línea basura que a veces deja la terminal
      output = output.trim();
      
    } catch (e: unknown) {
      // Si el usuario metió un error de sintaxis nativo (ej: db.err()), la consola de Windows explota,
      // así que lo atrapo aquí y se lo devuelvo como texto para que la IA lo vea y lo regañe.
      const execError = e as { stdout?: string; message?: string };
      output = `Error ejecutando comando localmente:\n${execError.stdout || execError.message || String(e)}`;
    }

    // Devuelvo todo al frontend para que Terminal.tsx lo dibuje en pantalla
    return NextResponse.json({
        output,
        systemState: await getSystemState(),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Endpoint secundario: Solo devuelve de forma cruda si estas en la BD test u otra.
export async function GET() {
   const state = await getSystemState();
   return NextResponse.json({ state });
}
