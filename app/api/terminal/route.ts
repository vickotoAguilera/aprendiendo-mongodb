import { NextResponse } from 'next/server';
import { getSystemState, updateSystemState } from '@/lib/db';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    const systemState = await getSystemState();

    let output = "";
    const cmdStr = command.trim();

    // Comandos ignorados o manejados por frontend
    if (cmdStr.toLowerCase() === 'cls' || cmdStr.toLowerCase() === 'clear') {
      return NextResponse.json({ output: "", systemState });
    }

    if (cmdStr.toLowerCase().startsWith('use ')) {
      const dbName = cmdStr.split(' ')[1];
      await updateSystemState({ activeDb: dbName });
      output = `switched to db ${dbName}`;
      return NextResponse.json({ output, systemState: await getSystemState() });
    }

    try {
      // Connect specifically to the activeDb
      const activeDb = systemState.activeDb || "test";
      const connectionString = `mongodb://127.0.0.1:27017/${activeDb}`;
      
      // We use eval to run the command and get the output. We format the command carefully.
      const formattedCommand = cmdStr;
      
      const { stdout, stderr } = await execPromise(`mongosh "${connectionString}" --quiet --eval "${formattedCommand.replace(/"/g, '\\"')}"`);
      
      output = stdout || stderr;
      
      // Cleanup extra newlines from output if any
      output = output.trim();
      
    } catch (e: any) {
      output = `Error ejecutando comando localmente:\n${e.stdout || e.message}`;
    }

    return NextResponse.json({
        output,
        systemState: await getSystemState(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
   const state = await getSystemState();
   return NextResponse.json({ state });
}
