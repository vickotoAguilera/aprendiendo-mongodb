"use client"

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, CheckCircle2, TerminalSquare } from 'lucide-react';

interface TerminalEntry {
  command: string;
  output: string;
}

interface TerminalProps {
  onVerify: (logHistory: string) => void;
  isLoadingAi: boolean;
}

export function Terminal({ onVerify, isLoadingAi }: TerminalProps) {
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [logs, setLogs] = useState<TerminalEntry[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoadingAi) return;

    const currentCmd = input.trim();
    setInput('');

    if (currentCmd.toLowerCase() === 'cls' || currentCmd.toLowerCase() === 'clear') {
       setHistory([]);
       setLogs(prev => [...prev, { command: currentCmd, output: "Screen cleared." }]);
       return;
    }

    setHistory((prev) => [...prev, { command: currentCmd, output: "..." }]);
    setLogs((prev) => [...prev, { command: currentCmd, output: "..." }]);

    try {
      const res = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: currentCmd })
      });
      const data = await res.json();

      setHistory((prev) => {
        const newHist = [...prev];
        newHist[newHist.length - 1] = { command: currentCmd, output: data.output };
        return newHist;
      });
      
      setLogs((prev) => {
        const newLogs = [...prev];
        if (newLogs.length > 0) {
            newLogs[newLogs.length - 1] = { command: currentCmd, output: data.output };
        }
        return newLogs;
      });

    } catch (err) {
      const errOut = "Network Error: Could not connect to local db emulator.";
      setHistory(prev => { const n = [...prev]; n[n.length - 1] = { command: currentCmd, output: errOut }; return n; });
      setLogs(prev => { const n = [...prev]; n[n.length - 1] = { command: currentCmd, output: errOut }; return n; });
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    const handleAddHint = (e: CustomEvent) => {
       setHistory(prev => [...prev, { command: "— [AI TUTOR] —", output: e.detail }]);
    };
    const handleClearLogs = () => {
       setHistory([]);
       setLogs([]);
    };
    window.addEventListener("addTerminalHint", handleAddHint as EventListener);
    window.addEventListener("clearTerminalLogs", handleClearLogs as EventListener);
    
    return () => {
       window.removeEventListener("addTerminalHint", handleAddHint as EventListener);
       window.removeEventListener("clearTerminalLogs", handleClearLogs as EventListener);
    };
  }, []);

  const handleVerify = () => {
     // Serialize logs to send to AI
     const logString = logs.map(l => `> ${l.command}\n${l.output}`).join('\n\n');
     onVerify(logString);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Main Terminal */}
      <div className="flex flex-col flex-[2] bg-[#050510]/80 backdrop-blur-3xl font-mono p-5 rounded-2xl border border-indigo-500/40 shadow-[0_0_50px_-10px_rgba(139,92,246,0.2)] overflow-hidden">
        <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
          <div className="text-indigo-100 mb-6 tracking-wide font-bold" style={{ textShadow: "0 0 8px rgba(129,140,248,0.8)" }}>
            MongoDB shell version vX.Y.Z<br/>
            connecting to: mongodb://127.0.0.1:27017/?compressors=disabled<br/>
          </div>

          {history.map((entry, i) => (
            <div key={i} className="mb-4">
              <div className="flex text-indigo-50 font-bold">
                <span className={cn("mr-3", entry.command.includes("[AI TUTOR]") ? "text-amber-500" : "text-fuchsia-500")}>&gt;</span>
                <span>{entry.command}</span>
              </div>
              {entry.output && (
                <pre className={cn("mt-2 whitespace-pre-wrap ml-6 p-3 rounded-lg border shadow-inner text-sm", entry.command.includes("[AI TUTOR]") ? "text-amber-200 bg-amber-950/30 border-amber-500/20" : "text-indigo-200 bg-indigo-950/30 border-indigo-500/10")}>{entry.output}</pre>
              )}
            </div>
          ))}
          {isLoadingAi && (
              <div className="mb-4 ml-6 text-fuchsia-400 animate-pulse text-sm">
                  El Tutor IA está analizando los logs...
              </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={executeCommand} className="flex relative items-center mt-2 bg-black/40 p-2 rounded-xl border border-indigo-500/20 shadow-inner">
          <span className="text-fuchsia-500 absolute left-4 animate-pulse">&gt;</span>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoadingAi}
            className="w-full bg-transparent border-none outline-none text-indigo-50 font-bold pl-8 pr-12 text-lg placeholder:text-indigo-900/50 disabled:opacity-50"
            placeholder={isLoadingAi ? "Esperando a la IA..." : "Escribe un comando..."}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" disabled={isLoadingAi} className="absolute right-4 text-fuchsia-600 hover:text-fuchsia-300 transition-colors disabled:opacity-50">
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-[#0d0d1a] border border-gray-800 rounded-xl p-3">
         <div className="flex items-center text-gray-400 text-sm font-mono gap-2">
            <TerminalSquare size={16}/> Logs de Ejecución {logs.length > 0 && `(${logs.length})`}
         </div>
         <button 
           onClick={handleVerify} 
           disabled={isLoadingAi}
           className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:pointer-events-none"
         >
           <CheckCircle2 size={18} /> Verificar con IA
         </button>
      </div>

      {/* Visual Logs Pane */}
      <div className="flex-1 bg-black/60 rounded-xl border border-gray-800 p-4 font-mono text-xs overflow-y-auto max-h-[150px] custom-scrollbar shadow-inner text-gray-500">
         {logs.length === 0 ? (
            <span className="opacity-50">Los logs del sistema de la vida real de tu base de datos aparecerán aquí. Estos persisten después de un 'cls'.</span>
         ) : (
            logs.map((l, i) => (
              <div key={i} className="mb-2 border-b border-gray-900 pb-2">
                 <div className="text-gray-400 font-bold mb-1">$ {l.command}</div>
                 <div className="text-gray-600 pl-4 whitespace-pre-wrap">{l.output}</div>
              </div>
            ))
         )}
         <div ref={logsEndRef} />
      </div>
    </div>
  );
}
