"use client";

import { useEffect, useState, useCallback } from "react";
import { Terminal } from "@/components/Terminal";
import { Database, FolderCheck, Cpu, BrainCircuit, BookOpen, ChevronRight, RotateCcw, HelpCircle, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modules } from "@/lib/levels";

// Aquí definí el componente principal que maneja toda la vista de mi aplicación.
// Básicamente, uso estados para controlar en qué módulo y lección va el estudiante.
export default function HomeClient() {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [state, setState] = useState<{ activeDb: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [aiScenario, setAiScenario] = useState<{ theory: string; objective: string } | null>(null);
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);

  const currentModule = modules[activeModuleIndex];
  const currentLesson = currentModule?.lessons[activeLessonIndex];

  // Implementé esta función para guardar el progreso del alumno en la DB local cada vez que avanza de lección.
  // Así si recargan la página, no pierden donde iban.
  const saveProgress = useCallback(async (modIdx: number, lesIdx: number) => {
    try {
      await fetch("/api/terminal/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleIndex: modIdx, lessonIndex: lesIdx }),
      });
    } catch (e) {
      console.error("Oops, error guardando progreso:", e);
    }
  }, []);

  // Hice esta función para traer la intro y saber qué DB está activa
  const fetchData = async () => {
    try {
      const res = await fetch("/api/terminal");
      const data = await res.json();
      setState(data.state);
      return data.state;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Cargar progreso y estado al montar
  useEffect(() => {
    const init = async () => {
      const stateData = await fetchData();

      // Restaurar progreso guardado
      if (stateData && typeof stateData.moduleIndex === "number" && typeof stateData.lessonIndex === "number") {
        const mIdx = stateData.moduleIndex;
        const lIdx = stateData.lessonIndex;
        // Verificar que los índices sean válidos
        if (mIdx >= 0 && mIdx < modules.length) {
          const mod = modules[mIdx];
          if (lIdx >= 0 && lIdx < mod.lessons.length) {
            setActiveModuleIndex(mIdx);
            setActiveLessonIndex(lIdx);
          }
        }
      }
      setHasLoadedProgress(true);

      setTimeout(() => {
        const event = new CustomEvent("addTerminalHint", {
          detail:
            "¡Hola! Soy tu tutor Senior especializado en MongoDB. Prepárate para manejar flujos de trabajo reales.\n\nPara empezar, fíjate en el Módulo actual en la barra lateral y lee tu primer Objetivo. Escribe tus comandos en la consola, y cuando estés listo presiona 'Verificar con IA'.",
        });
        window.dispatchEvent(event);
      }, 1000);
    };
    init();
  }, []);

  // Guardar progreso cuando los índices cambian (después de la carga inicial)
  useEffect(() => {
    if (hasLoadedProgress) {
      saveProgress(activeModuleIndex, activeLessonIndex);
    }
  }, [activeModuleIndex, activeLessonIndex, hasLoadedProgress, saveProgress]);

  const displayTheory = currentLesson?.isDynamicAi && aiScenario ? aiScenario.theory : currentLesson?.theory;
  const displayObjective = currentLesson?.isDynamicAi && aiScenario ? aiScenario.objective : currentLesson?.objective;

  // Esta parte es clave: Aquí manejo la evaluación con la IA. 
  // Tomo lo que el estudiante escribió y se lo mando a Groq para que me diga si lo hizo bien o no.
  const handleVerify = async (logHistory: string) => {
    fetchData();
    setIsLoadingAi(true);

    try {
      // Hago la consulta POST hacia mi propio backend de evaluación
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentModule: currentModule,
          currentLesson: { title: currentLesson?.title, objective: displayObjective },
          logHistory: logHistory,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Error del servidor (${res.status})` }));
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error del Servidor: " + (errorData.error || `Status ${res.status}`) }));
        setIsLoadingAi(false);
        return;
      }

      const data = await res.json();

      if (data.error) {
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error del Servidor: " + data.error }));
      } else if (typeof data.isSuccess === "undefined") {
        // La IA devolvió algo, pero no en el formato esperado
        const msg = data.message || data.feedback || JSON.stringify(data);
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Respuesta del Tutor: " + msg }));
      } else if (!data.isSuccess) {
        const msg = data.message || "No lograste el objetivo todavía. Revisa tu comando e intenta de nuevo.";
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: msg }));
      } else {
        const msg = data.message || "¡Excelente! Objetivo cumplido.";
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: msg }));

        if (data.advance) {
          setTimeout(() => {
            if (activeLessonIndex + 1 < currentModule.lessons.length) {
              setActiveLessonIndex(activeLessonIndex + 1);
            } else if (activeModuleIndex + 1 < modules.length) {
              setActiveModuleIndex(activeModuleIndex + 1);
              setActiveLessonIndex(0);
            }
            setAiScenario(null);
          }, 1500);
        }
      }
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error de red con IA tutor. Verifica tu conexión a internet." }));
    }
    setIsLoadingAi(false);
  };

  const handleResetCourse = async () => {
    if (confirm(`ATENCION. ¿Seguro que deseas reiniciar el entorno? Esto borrará toda tu base de datos actual ('${state?.activeDb || 'empresa'}') y te devolverá al inicio del curso.`)) {
      try {
        await fetch("/api/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "db.dropDatabase()" }),
        });

        setActiveModuleIndex(0);
        setActiveLessonIndex(0);
        setAiScenario(null);

        window.dispatchEvent(new CustomEvent("clearTerminalLogs"));
        fetchData();

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "El entorno ha sido eliminado y reseteado. ¡Empecemos de nuevo!" }));
        }, 500);
      } catch (e) {
        console.error("Error reseteando", e);
      }
    }
  };

  // Con esto el CEO le asigna un caso práctico inventado al azar
  const generateAICase = async () => {
    setIsGeneratingCase(true);
    try {
      const res = await fetch("/api/ai/generate-case");

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Error del servidor (${res.status})` }));
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error del Servidor: " + (errorData.error || `Status ${res.status}`) }));
        setIsGeneratingCase(false);
        return;
      }

      const data = await res.json();
      if (data.theory && data.objective) {
        setAiScenario(data);
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "NUEVA ALERTA: Nuevo caso laboral asignado por el CEO. Lee las instrucciones en el panel de arriba." }));
      } else if (data.error) {
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error del Servidor: " + data.error }));
      } else {
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "La IA no pudo generar un caso válido. Intenta de nuevo." }));
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "No se pudo contactar al CEO (Error de Red)." }));
    }
    setIsGeneratingCase(false);
  };

  const askHelp = async () => {
    const question = window.prompt("¿Qué comando o concepto olvidaste? La IA te responderá rápido y te dará un ejemplo de sintaxis.");
    if (!question) return;

    window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Consultando tus dudas con el Tutor en la Nube..." }));
    try {
      const res = await fetch("/api/ai/ask-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error del servidor al consultar ayuda." }));
        return;
      }

      const data = await res.json();
      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: data.error ? "Error: " + data.error : data.message }));
    } catch (e) {
      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error de red al consultar la duda." }));
    }
  };

  const handleSidebarClick = (mI: number, lI: number) => {
    setActiveModuleIndex(mI);
    setActiveLessonIndex(lI);
    setAiScenario(null);
  };

  return (
    <main className="min-h-screen relative bg-[#09090b] text-gray-200 overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[0%] w-[40%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="h-screen flex flex-col">
        <header className="flex items-center justify-between border-b border-gray-800 p-4 px-8 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-500" />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-white leading-none">Mongo<span className="text-emerald-500">Learn</span> <span className="text-fuchsia-500">AI</span></h1>
              <span className="text-[10px] text-gray-400/60 font-semibold tracking-widest mt-1 uppercase">by vickoto de victechweb</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <span className="px-4 py-2 bg-gray-900 rounded-full text-xs border border-gray-800 shadow-inner flex items-center gap-2">
              <FolderCheck size={14} className="text-emerald-400" />
              BD Activa: <span className="text-emerald-400 font-mono">{state?.activeDb || "test"}</span>
            </span>
            <button onClick={askHelp} disabled={isLoadingAi} className="px-4 py-2 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all rounded-full text-xs border border-indigo-500/30 font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-inner">
              <HelpCircle size={14} /> Preguntar Comando
            </button>
            <span className="px-4 py-2 bg-fuchsia-900/30 text-fuchsia-200 rounded-full text-xs border border-fuchsia-500/30 font-semibold flex items-center gap-2">
              <BrainCircuit size={14} /> Tutor Groq Activo
            </span>
            <a href="https://github.com/vickotoAguilera/aprendiendo-mongodb" target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-900/40 text-gray-300 hover:bg-slate-800 hover:text-white transition-all rounded-full text-xs border border-gray-700/50 font-semibold flex items-center gap-2 shadow-inner group">
              <Code size={14} className="group-hover:text-white" /> Repositorio
            </a>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 bg-[#0d0d12] border-r border-gray-800/60 overflow-y-auto custom-scrollbar flex flex-col p-4 z-10">
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 ml-2 flex items-center gap-2"><BookOpen size={14} /> Temario</div>
            {modules.map((mod, mIndex) => (
              <div key={mod.id} className="mb-4">
                <div className={`font-bold text-sm mb-2 ml-2 ${activeModuleIndex === mIndex ? 'text-fuchsia-400' : 'text-gray-300'}`}>
                  {mod.title}
                </div>
                <div className="flex flex-col gap-1 border-l border-gray-800 ml-3 pl-3">
                  {mod.lessons.map((les, lIndex) => {
                    const isActive = activeModuleIndex === mIndex && activeLessonIndex === lIndex;
                    return (
                      <button
                        key={les.id}
                        onClick={() => handleSidebarClick(mIndex, lIndex)}
                        className={`text-left text-sm py-2 px-3 rounded-lg transition-all flex items-center justify-between ${isActive ? 'bg-fuchsia-500/10 text-fuchsia-300 font-semibold border border-fuchsia-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
                      >
                        <span className="truncate pr-2">{les.title}</span>
                        {isActive && <ChevronRight size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button onClick={handleResetCourse} className="mt-8 flex items-center justify-center gap-2 p-3 w-full rounded-xl border border-red-500/30 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-300 transition-colors font-bold text-sm">
              <RotateCcw size={16} /> Reiniciar Todo
            </button>
          </div>

          <div className="flex-1 flex gap-6 p-6 h-full max-h-full overflow-hidden">
            <div className={`flex-1 flex flex-col border rounded-2xl p-8 shadow-xl backdrop-blur-xl relative overflow-y-auto custom-scrollbar transition-all duration-500 ${currentLesson?.isTest ? 'bg-[#1a0f14]/80 border-red-500/40' : 'bg-[#121214]/80 border-gray-800/60'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentLesson?.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="mb-4 inline-flex items-center text-fuchsia-500 text-xs font-semibold tracking-widest uppercase">
                    <Cpu size={14} className="mr-2" /> {currentLesson?.isTest ? 'Modo Evaluación Práctica' : currentLesson?.isDynamicAi ? 'Desafío IA Dinámico' : 'Lección Dinámica IA'}
                  </div>
                  <h2 className="text-3xl font-extrabold text-white mb-6 leading-tight">{currentLesson?.title}</h2>

                  {/* === OBJETIVO / RETO === Siempre visible arriba para que el usuario lo vea primero */}
                  {(!currentLesson?.isDynamicAi || aiScenario) && (
                    <div className={`mb-6 p-5 rounded-xl border shadow-inner ${currentLesson?.isTest ? 'bg-red-950/30 border-red-500/40' : 'bg-fuchsia-950/20 border-fuchsia-500/20'}`}>
                      <h3 className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${currentLesson?.isTest ? 'text-red-400' : 'text-fuchsia-400'}`}>🎯 Objetivo / Reto</h3>
                      <p className="text-lg text-white whitespace-pre-wrap leading-snug font-semibold">{displayObjective}</p>
                    </div>
                  )}

                  {/* === TEORIA / CONTENIDO === */}
                  <div className="prose prose-invert max-w-none prose-p:text-gray-300 leading-relaxed text-base">
                    {currentLesson?.isDynamicAi && !aiScenario ? (
                      <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-2xl border border-emerald-500/30">
                        <p className="text-gray-400 mb-6 text-center">{currentLesson.theory}</p>
                        <button
                          onClick={generateAICase}
                          disabled={isGeneratingCase}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white font-bold tracking-wider uppercase text-sm shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isGeneratingCase ? 'Contactando al Servidor...' : 'REQUERIR TAREA MENTAL'}
                        </button>
                      </div>
                    ) : (
                      displayTheory?.split("\n").map((line, i) => (
                        <p key={i}>{line.includes("`") ? <span dangerouslySetInnerHTML={{ __html: line.replace(/`(.*?)`/g, '<code class="bg-indigo-900/40 text-indigo-200 px-1 py-0.5 rounded border border-indigo-500/20">$1</code>') }} /> : line}</p>
                      ))
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex-[1.2] h-full relative shadow-[0_0_50px_-12px_rgba(217,70,239,0.15)] rounded-xl flex flex-col">
              <Terminal onVerify={handleVerify} isLoadingAi={isLoadingAi} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}