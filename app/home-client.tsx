"use client";

import { useEffect, useState, useCallback } from "react";
import { Terminal } from "@/components/Terminal";
import { Database, FolderCheck, Cpu, BrainCircuit, BookOpen, ChevronRight, RotateCcw, HelpCircle, Code, Upload, FileText, CheckCircle2, MessageSquareText, FlaskConical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { modules } from "@/lib/levels";
import { GlossaryModal } from "@/components/GlossaryModal";
import { AIChatModal } from "@/components/AIChatModal";

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

  type CustomStep = { id: string; instruction: string; hint?: string };
  const [viewMode, setViewMode] = useState<"course" | "custom">("course");
  const [customDocSteps, setCustomDocSteps] = useState<CustomStep[] | null>(null);
  const [customDocTitle, setCustomDocTitle] = useState("");
  const [activeCustomDocStep, setActiveCustomDocStep] = useState(0);
  const [customDocPassed, setCustomDocPassed] = useState<boolean[]>([]);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);

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

  const displayTheory = viewMode === "custom" ? "Modo Resolución de Documento Guiado. Sigue las instrucciones paso a paso." : (currentLesson?.isDynamicAi && aiScenario ? aiScenario.theory : currentLesson?.theory);
  const displayObjective = viewMode === "custom" && customDocSteps ? customDocSteps[activeCustomDocStep]?.instruction : (currentLesson?.isDynamicAi && aiScenario ? aiScenario.objective : currentLesson?.objective);
  const displayTitle = viewMode === "custom" ? `${customDocTitle} - ${customDocSteps?.[activeCustomDocStep]?.id || ''}` : currentLesson?.title;

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
          currentModule: viewMode === "custom" ? { title: "Modo Guiado" } : currentModule,
          currentLesson: { title: displayTitle, objective: displayObjective },
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
            if (viewMode === "custom" && customDocSteps) {
               setCustomDocPassed(prev => {
                  const n = [...prev];
                  n[activeCustomDocStep] = true;
                  return n;
               });
            } else {
               if (activeLessonIndex + 1 < currentModule.lessons.length) {
                 setActiveLessonIndex(activeLessonIndex + 1);
               } else if (activeModuleIndex + 1 < modules.length) {
                 setActiveModuleIndex(activeModuleIndex + 1);
                 setActiveLessonIndex(0);
               }
               setAiScenario(null);
            }
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
    } catch {
      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "No se pudo contactar al CEO (Error de Red)." }));
    }
    setIsGeneratingCase(false);
  };

  const askHelp = () => {
    setShowChat(true);
  };

  const handleStartTest = async () => {
    setIsGeneratingTest(true);
    window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Contactando al Tutor Groq para generar 6 misiones de prueba en vivo..." }));
    
    try {
      const res = await fetch("/api/ai/generate-test");
      const data = await res.json();
      
      if (data.steps && Array.isArray(data.steps)) {
        setCustomDocTitle(data.title || "Simulador de Prueba");
        setCustomDocSteps(data.steps);
        setActiveCustomDocStep(0);
        setCustomDocPassed(new Array(data.steps.length).fill(false));
        setViewMode("custom");
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: `¡Simulador listo! Se cargaron ${data.steps.length} retos. ¡Mucha suerte!` }));
      } else {
        window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error: La IA no pudo generar el examen." }));
      }
    } catch {
      window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: "Error de red al crear el examen." }));
    }
    setIsGeneratingTest(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: `Leyendo y parseando el documento '${file.name}' con LLaMA...` }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
         const res = await fetch("/api/ai/parse-document", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentText: text })
         });
         const data = await res.json();
         if (data.steps && Array.isArray(data.steps)) {
            setCustomDocTitle(data.title || "Documento Subido");
            setCustomDocSteps(data.steps);
            setActiveCustomDocStep(0);
            setCustomDocPassed(new Array(data.steps.length).fill(false));
            setViewMode("custom");
            window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: `¡Documento parseado en ${data.steps.length} tareas modulares! Comencemos.` }));
         } else {
            window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: `Error: La IA no pudo estructurar el documento correctamente.` }));
         }
      } catch {
         window.dispatchEvent(new CustomEvent("addTerminalHint", { detail: `Error de red al procesar documento.` }));
      }
      setIsParsingDoc(false);
    };
    reader.readAsText(file);
    e.target.value = '';
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
          <div className="flex gap-3">
             <button onClick={() => setShowGlossary(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white rounded-lg transition-colors text-sm font-semibold shadow-inner">
               <BookOpen size={16} /> Glosario Comandos
             </button>
             <button onClick={() => setShowChat(true)} className="flex items-center gap-2 px-4 py-2 bg-fuchsia-900/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-600 hover:text-white rounded-lg transition-colors text-sm font-semibold shadow-inner">
               <MessageSquareText size={16} /> Tutor IA Chat
             </button>
          </div>
          <div className="flex gap-4 items-center">
            <span className="px-4 py-2 bg-gray-900 rounded-full text-xs border border-gray-800 shadow-inner flex items-center gap-2">
              <FolderCheck size={14} className="text-emerald-400" />
              BD Activa: <span className="text-emerald-400 font-mono">{state?.activeDb || "test"}</span>
            </span>
            <button onClick={askHelp} disabled={isLoadingAi} className="px-4 py-2 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-600 hover:text-white transition-all rounded-full text-xs border border-indigo-500/30 font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-inner">
              <HelpCircle size={14} /> Preguntar Comando
            </button>
            <label className={`px-4 py-2 bg-amber-900/30 text-amber-200 hover:bg-amber-800 hover:text-white transition-all rounded-full text-xs border border-amber-500/30 font-semibold flex items-center gap-2 cursor-pointer shadow-inner ${isParsingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={14} /> {isParsingDoc ? 'Parseando...' : 'Subir Ejercicio'}
              <input type="file" accept=".txt,.md" className="hidden" onChange={handleFileUpload} disabled={isParsingDoc} />
            </label>
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
            <div className="flex text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 ml-2 gap-4">
               <button onClick={() => setViewMode("course")} className={`flex items-center gap-2 transition-colors ${viewMode === "course" ? "text-fuchsia-400" : "hover:text-gray-300"}`}><BookOpen size={14} /> Temario</button>
               {customDocSteps && <button onClick={() => setViewMode("custom")} className={`flex items-center gap-2 transition-colors ${viewMode === "custom" ? "text-emerald-400" : "hover:text-gray-300"}`}><FileText size={14} /> Tareas</button>}
            </div>

            {viewMode === "course" ? (
               modules.map((mod, mIndex) => (
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
               ))
            ) : (
                customDocSteps?.map((step, idx) => (
                  <button key={idx} onClick={() => setActiveCustomDocStep(idx)} className={`text-left w-full text-sm py-2 px-3 rounded-lg transition-all flex items-center justify-between mb-2 ${activeCustomDocStep === idx ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>
                    <span className="truncate pr-2">{step.id}</span>
                    {customDocPassed[idx] && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </button>
                ))
            )}

            {viewMode === "custom" && customDocSteps && (
               <div className="mt-8 flex gap-2 w-full">
                  <button disabled={activeCustomDocStep === 0} onClick={() => setActiveCustomDocStep(p => p - 1)} className="flex-1 p-2 rounded-xl border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 text-xs font-bold">Atrás</button>
                  <button disabled={!customDocPassed[activeCustomDocStep] || activeCustomDocStep === customDocSteps.length - 1} onClick={() => setActiveCustomDocStep(p => p + 1)} className="flex-1 p-2 rounded-xl border border-emerald-500/30 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 transition-colors disabled:opacity-50 text-xs font-bold">Siguiente</button>
               </div>
            )}

            <button onClick={handleResetCourse} className="mt-8 flex items-center justify-center gap-2 p-3 w-full rounded-xl border border-red-500/30 bg-red-950/20 text-red-500 hover:bg-red-900/40 hover:text-red-300 transition-colors font-bold text-sm">
              <RotateCcw size={16} /> Reiniciar Todo
            </button>

            <button disabled={isGeneratingTest} onClick={handleStartTest} className="mt-4 flex flex-col items-center justify-center gap-1 p-3 w-full rounded-xl border border-blue-500/30 bg-blue-950/20 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 transition-colors font-bold shadow-[0_0_20px_rgba(59,130,246,0.1)] disabled:opacity-50">
              <div className="flex items-center gap-2"><FlaskConical size={16} /> {isGeneratingTest ? 'Generando...' : 'Estudiar para Pruebas'}</div>
              <span className="text-[10px] text-blue-500/60 font-normal">Simulador 6 Misiones</span>
            </button>
          </div>

          <div className="flex-1 flex gap-6 p-6 h-full max-h-full overflow-hidden">
            <div className={`flex-1 flex flex-col border rounded-2xl p-8 shadow-xl backdrop-blur-xl relative overflow-y-auto custom-scrollbar transition-all duration-500 ${viewMode === 'custom' ? 'bg-[#0f1a14]/90 border-emerald-500/40' : currentLesson?.isTest ? 'bg-[#1a0f14]/80 border-red-500/40' : 'bg-[#121214]/80 border-gray-800/60'}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode === 'custom' ? `custom-${activeCustomDocStep}` : currentLesson?.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`mb-4 inline-flex items-center text-xs font-semibold tracking-widest uppercase ${viewMode === 'custom' ? 'text-emerald-500' : 'text-fuchsia-500'}`}>
                    <Cpu size={14} className="mr-2" /> {viewMode === 'custom' ? 'Modo Tareas de Documento Guiado' : currentLesson?.isTest ? 'Modo Evaluación Práctica' : currentLesson?.isDynamicAi ? 'Desafío IA Dinámico' : 'Lección Dinámica IA'}
                  </div>
                  <h2 className="text-3xl font-extrabold text-white mb-6 leading-tight">{displayTitle}</h2>

                  {/* === OBJETIVO / RETO === Siempre visible arriba para que el usuario lo vea primero */}
                  {(!currentLesson?.isDynamicAi || aiScenario || viewMode === 'custom') && (
                    <div className={`mb-6 p-5 rounded-xl border shadow-inner ${viewMode === 'custom' ? 'bg-emerald-950/30 border-emerald-500/40' : currentLesson?.isTest ? 'bg-red-950/30 border-red-500/40' : 'bg-fuchsia-950/20 border-fuchsia-500/20'}`}>
                      <h3 className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${viewMode === 'custom' ? 'text-emerald-400' : currentLesson?.isTest ? 'text-red-400' : 'text-fuchsia-400'}`}>🎯 Objetivo / Reto</h3>
                      <p className="text-lg text-white whitespace-pre-wrap leading-snug font-semibold">{displayObjective}</p>
                      
                      {viewMode === 'custom' && customDocSteps?.[activeCustomDocStep]?.hint && (
                         <div className="mt-4 p-3 bg-black/40 border border-emerald-500/20 rounded-lg flex items-start gap-2">
                            <HelpCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-emerald-200/80 italic">{customDocSteps[activeCustomDocStep].hint}</p>
                         </div>
                      )}
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
      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
      <AIChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
    </main>
  );
}