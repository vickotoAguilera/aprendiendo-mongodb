import { NextResponse } from 'next/server';
import { getSystemState, updateSystemState } from '@/lib/db';

// POST: Guardar progreso del módulo y lección actuales
export async function POST(req: Request) {
  try {
    const { moduleIndex, lessonIndex } = await req.json();

    if (typeof moduleIndex !== 'number' || typeof lessonIndex !== 'number') {
      return NextResponse.json({ error: 'moduleIndex y lessonIndex son requeridos' }, { status: 400 });
    }

    const updated = await updateSystemState({ moduleIndex, lessonIndex });
    return NextResponse.json({ success: true, state: updated });
  } catch (error: unknown) {
    console.error('Error guardando progreso:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET: Obtener progreso actual
export async function GET() {
  try {
    const state = await getSystemState();
    return NextResponse.json({
      moduleIndex: state.moduleIndex ?? 0,
      lessonIndex: state.lessonIndex ?? 0,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
