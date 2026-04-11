"use client";

import { useEffect, useState } from "react";
import { Terminal } from "@/components/Terminal";
import { Database, FolderCheck, Cpu, BrainCircuit, BookOpen, ChevronRight, RotateCcw, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modules, Lesson, Module } from "@/lib/levels";

export default function Home() {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [state, setState] = useState<{ activeDb: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isGeneratingCase, setIsGeneratingCase] = useState(false);
  const [aiScenario, setAiScenario] = useState<{ theory: string, objective: string } | null>(null);

  const currentModule = modules[activeModuleIndex];
  const currentLesson = currentModule.lessons[activeLessonIndex];

  // Fetch local DB state initially
  const fetchData = async () => {
    try {
      const res = await fetch("/api/terminal");
      const data = await res.json();
      setState(data.state);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    // Dispatch initial greeting
    setTimeout(() => {
       const event = new CustomEvent("addTerminalHint", { 
           detail: "¡Hola! Soy tu tutor Senior especializado en MongoDB. Prepárate para manejar flujos de trabajo reales.\n\nPara empezar, fíjate en el Módulo actual en la barra lateral y lee tu primer Objetivo. Escribe tus comandos en la consola, y cuando estés listo presiona 'Verificar con IA'." 
       });
       window.dispatchEvent(event);
    }, 1000);
  }, []);

  const handleVerify = async (logHistory: string) => {
      fetchData(); // Trigger activeDb update if switched
      setIsLoadingAi(true);
      
      try {
         const res = await fetch("/api/ai/evaluate", {
             method: "POST",
             headers: { "Content-Type" : "application/json" },
             body: JSON.stringify({ 
                 currentModule: currentModule,
                 currentLesson: { title: currentLesson?.title, objective: displayObjective },
                 logHistory: logHistory
             })
         });
         const data = await res.json();

         if (data.error) {
             const event = new CustomEvent("addTerminalHint", { detail: "Error del Servidor: " + data.error });
             window.dispatchEvent(event);
         } else if (!data.isSuccess) {
             // Ai is giving a hint
             const event = new CustomEvent("addTerminalHint", { detail: data.message });
             window.dispatchEvent(event);
         } else {
             // AI congratulates and moves to next lesson
             const event = new CustomEvent("addTerminalHint", { detail: data.message });
             window.dispatchEvent(event);

             if (data.advance) {
                 setTimeout(() => {
                    // Navigate to next lesson or module
                    if (activeLessonIndex + 1 < currentModule.lessons.length) {
                        setActiveLessonIndex(activeLessonIndex + 1);
                    } else if (activeModuleIndex + 1 < modules.length) {
                        setActiveModuleIndex(activeModuleIndex + 1);
                        setActiveLessonIndex(0);
                    }
                 }, 1500);
             }
         }
      } catch(e) { 
          console.error(e); 
          const event = new CustomEvent("addTerminalHint", { detail: "Error de red con IA tutor." });
          window.dispatchEvent(event);
      }
      setIsLoadingAi(false);
  }

  const handleResetCourse = async () => {
    if (confirm(`🚨 ¿Seguro que deseas reiniciar el entorno? Esto borrará toda tu base de datos actual ('${state?.activeDb || 'empresa'}') y te devolverá al inicio del curso.`)) {
      try {
        await fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'db.dropDatabase()' })
        });
        setActiveModuleIndex(0);
        setActiveLessonIndex(0);
        setAiScenario(null);
        window.dispatchEvent(new CustomEvent('clearTerminalLogs'));
        fetchData();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "El entorno ha sido eliminado y reseteado. ¡Empecemos de nuevo!" }));
        }, 500);
      } catch(e) {
        console.error("Error reseteando", e);
      }
    }
  };

  const generateAICase = async () => {
     setIsGeneratingCase(true);
     try {
         const res = await fetch("/api/ai/generate-case");
         const data = await res.json();
         if (data.theory && data.objective) {
             setAiScenario(data);
             window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "💼 Nuevo caso laboral asignado por el CEO. Lee las instrucciones en el panel." }));
         } else if (data.error) {
             window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error del Servidor: " + data.error }));
         }
     } catch (e) {
         window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "No se pudo contactar al CEO (Error de Red)." }));
     }
     setIsGeneratingCase(false);
  };

  const askHelp = async () => {
      const question = window.prompt("¿Qué comando o concepto olvidaste? La IA te responderá rápido y te dará un ejemplo de sintaxis.");
      if (!question) return;

      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "🔎 Consultando tus dudas con el Tutor..." }));
      try {
          const res = await fetch("/api/ai/ask-help", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ question })
          });
          const data = await res.json();
          window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: data.error ? ("Error: " + data.error) : data.message }));
      } catch (e) {
          window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error de red al consultar la duda." }));
      }
  };

  const handleSidebarClick = (mI: number, lI: number) => {
      setActiveModuleIndex(mI);
      setActiveLessonIndex(lI);
      setAiScenario(null);
  };

  // Resolve which text to display (AI generated or static)
  const displayTheory = currentLesson?.isDynamicAi && aiScenario ? aiScenario.theory : currentLesson?.theory;
  const displayObjective = currentLesson?.isDynamicAi && aiScenario ? aiScenario.objective : currentLesson?.objective;

  const currentEvaluationPayload = {
      title: currentLesson?.title,
      objective: displayObjective
  };

  return (
    <main className="min-h-screen relative bg-[#09090b] text-gray-200 overflow-hidden font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full" />
          <div className="absolute top-[40%] right-[0%] w-[40%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full" />
      </div>

      <div className="h-screen flex flex-col">
        <header className="flex items-center justify-between border-b border-gray-800 p-4 px-8 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Mongo<span className="text-emerald-500">Learn</span> <span className="text-fuchsia-500">AI</span></h1>
          </div>
          <div className="flex gap-4 items-center">
            <span className="px-4 py-2 bg-gray-900 rounded-full text-xs border border-gray-800 shadow-inner flex items-center gap-2">
              <FolderCheck size={14} className="text-emerald-400" />
              BD Activa: <span className="text-emerald-400 font-mono">{state?.activeDb || 'test'}</span>
            </span>
            <button 
              onClick={askHelp}
              disabled={isLoadingAi}
              className="px-4 py-2 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all rounded-full text-xs border border-indigo-500/30 font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-inner"
            >
               <HelpCircle size={14} /> Preguntar Comando
            </button>
            <span className="px-4 py-2 bg-fuchsia-900/30 text-fuchsia-200 rounded-full text-xs border border-fuchsia-500/30 font-semibold flex items-center gap-2">
               <BrainCircuit size={14} /> Tutor Groq Activo
            </span>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Modules */}
          <div className="w-72 bg-[#0d0d12] border-r border-gray-800/60 overflow-y-auto custom-scrollbar flex flex-col p-4 z-10">
             <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 ml-2 flex items-center gap-2"><BookOpen size={14}/> Temario</div>
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

             <button
               onClick={handleResetCourse}
               className="mt-8 flex items-center justify-center gap-2 p-3 w-full rounded-xl border border-red-500/30 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-300 transition-colors font-bold text-sm"
             >
               <RotateCcw size={16} /> Reiniciar Todo
             </button>
          </div>

          <div className="flex-1 flex gap-6 p-6 h-full max-h-full overflow-hidden">
            {/* Panel Izquierdo: Educativo IA */}
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
                          <Cpu size={14} className="mr-2"/> {currentLesson?.isTest ? 'Modo Evaluación Práctica' : 'Lección Dinámica IA'}
                      </div>
                      <h2 className="text-3xl font-extrabold text-white mb-6 leading-tight">
                          {currentLesson?.title}
                      </h2>
                      
                      <div className="prose prose-invert max-w-none prose-p:text-gray-300 leading-relaxed mb-8 text-base">
                          {currentLesson?.isDynamicAi && !aiScenario ? (
                             <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-2xl border border-emerald-500/30">
                                <p className="text-gray-400 mb-6 text-center">{currentLesson.theory}</p>
                                <button 
                                  onClick={generateAICase}
                                  disabled={isGeneratingCase}
                                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 text-white font-bold tracking-wider uppercase text-sm shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                  {isGeneratingCase ? 'Contactando al Servidor...' : '🤖 Requerir Tarea Empresarial'}
                                </button>
                             </div>
                          ) : (
                             displayTheory?.split('\n').map((line, i) => (
                                <p key={i}>{line.includes('`') ? <span dangerouslySetInnerHTML={{__html: line.replace(/`(.*?)`/g, '<code class="bg-indigo-900/40 text-indigo-200 px-1 py-0.5 rounded border border-indigo-500/20">$1</code>')}} /> : line}</p>
                             ))
                          )}
                      </div>

                      {(!currentLesson?.isDynamicAi || aiScenario) && (
                        <div className={`mt-auto p-5 rounded-xl border shadow-inner ${currentLesson?.isTest ? 'bg-red-950/30 border-red-500/40' : 'bg-fuchsia-950/20 border-fuchsia-500/20'}`}>
                            <h3 className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${currentLesson?.isTest ? 'text-red-400' : 'text-fuchsia-400'}`}>Objetivo / Reto</h3>
                            <p className="text-lg text-white whitespace-pre-wrap leading-snug font-semibold">{displayObjective}</p>
                        </div>
                      )}
                  </motion.div>
               </AnimatePresence>
            </div>

            {/* Panel Derecho: Terminal */}
            <div className="flex-[1.2] h-full relative shadow-[0_0_50px_-12px_rgba(217,70,239,0.15)] rounded-xl flex flex-col">
               <Terminal onVerify={handleVerify} isLoadingAi={isLoadingAi} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
