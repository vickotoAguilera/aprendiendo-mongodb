import fs from 'fs/promises';
import path from 'path';

// Path to our local database storage
const DB_ROOT = path.join(process.cwd(), 'local_db');
const SYSTEM_FILE = path.join(DB_ROOT, 'system.json');

// Tipo del estado del sistema con progreso del curso
interface SystemState {
  activeDb: string;
  level: number;
  moduleIndex: number;
  lessonIndex: number;
}

const DEFAULT_STATE: SystemState = {
  activeDb: 'test',
  level: 1,
  moduleIndex: 0,
  lessonIndex: 0,
};

// Ensure the local_db directory and system file exist
export async function initDb() {
  try {
    await fs.mkdir(DB_ROOT, { recursive: true });
    try {
      await fs.access(SYSTEM_FILE);
    } catch {
      // If it doesn't exist, create it with default state
      await fs.writeFile(SYSTEM_FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
}

// Get the current system state (active DB, learning level, and course progress)
export async function getSystemState(): Promise<SystemState> {
  await initDb();
  const data = await fs.readFile(SYSTEM_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  // Merge with defaults to ensure new fields exist on old system.json files
  return { ...DEFAULT_STATE, ...parsed };
}

// Update system state
export async function updateSystemState(newState: Partial<SystemState>) {
  const current = await getSystemState();
  const updated = { ...current, ...newState };
  await fs.writeFile(SYSTEM_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// Get a collection's documents
export async function getCollection(dbName: string, collection: string) {
  await initDb();
  const dbPath = path.join(DB_ROOT, dbName);
  const collectionPath = path.join(dbPath, `${collection}.json`);
  
  try {
    const data = await fs.readFile(collectionPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return []; // Return empty array if collection doesn't exist yet
  }
}

// Save a collection's documents
export async function saveCollection(dbName: string, collection: string, documents: unknown[]) {
  await initDb();
  const dbPath = path.join(DB_ROOT, dbName);
  await fs.mkdir(dbPath, { recursive: true }); // Ensure DB directory exists
  
  const collectionPath = path.join(dbPath, `${collection}.json`);
  await fs.writeFile(collectionPath, JSON.stringify(documents, null, 2), 'utf-8');
}
