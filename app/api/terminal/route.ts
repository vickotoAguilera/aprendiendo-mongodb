import { NextResponse } from 'next/server';
import { getSystemState, updateSystemState } from '@/lib/db';
import { exec } from 'child_process'; // Librería nativa de Node para correr comandos directo en el Sistema Operativo (Windows CMD)
import util from 'util';

// Promisificamos el comando de consola para poder usar await (esperar a que el PC termine de ejecutarlo)
const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    // 1. Recibir el comando escrito en el frontend (React/NextJS)
    const { command } = await req.json();
    
    // 2. Traer el estado pseudo-persistente (saber en qué base de datos estamos usando "use db")
    const systemState = await getSystemState();

    let output = "";
    const cmdStr = command.trim();

    // 3. Comandos ignorados: El limpiador de pantalla ya se maneja visualmente en el Frontend
    if (cmdStr.toLowerCase() === 'cls' || cmdStr.toLowerCase() === 'clear') {
      return NextResponse.json({ output: "", systemState });
    }

    // 4. Comando 'use' artificial: Guardamos en un log temporal el cambio de DB (ej: 'use empresa')
    if (cmdStr.toLowerCase().startsWith('use ')) {
      const dbName = cmdStr.split(' ')[1];
      // Guardamos la BD en memoria local de NextJS para no perderla en la siguiente peticion
      await updateSystemState({ activeDb: dbName });
      output = `switched to db ${dbName}`;
      return NextResponse.json({ output, systemState: await getSystemState() });
    }

    // 5. El núcleo del sistema: Ejecutar el comando del alumno en la computadora real
    try {
      // Connect specifically to the activeDb (Agregamos la Base al final de la ruta IP)
      const activeDb = systemState.activeDb || "test";
      const connectionString = `mongodb://127.0.0.1:27017/${activeDb}`;
      
      const formattedCommand = cmdStr;
      
      // Construccion del inyector:
      // Ejecutamos en CMD: mongosh "mongodb://..." --quiet --eval "comando_del_alumno"
      // El --eval hace que mongo se abra, ejecute codigo en V8 engine, y se cierre devolviendo texto plano sin UI.
      const { stdout, stderr } = await execPromise(`mongosh "${connectionString}" --quiet --eval "${formattedCommand.replace(/"/g, '\\"')}"`);
      
      output = stdout || stderr;
      
      // Cleanup extra newlines from output if any
      output = output.trim();
      
    } catch (e: any) {
      // Si el usuario metio un error de sintaxis como db.err() la shell explotará 
      // y lo devolvemos como texto para que la IA lo regañe.
      output = `Error ejecutando comando localmente:\n${e.stdout || e.message}`;
    }

    // Devolver el String resultado para que lo randerize el componente Terminal.tsx
    return NextResponse.json({
        output,
        systemState: await getSystemState(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Endpoint secundario: Solo devuelve de forma cruda si estas en la BD test u otra.
export async function GET() {
   const state = await getSystemState();
   return NextResponse.json({ state });
}
