import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

export function AIChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! Soy Groq, tu tutor de MongoDB. ¿Qué dudas tienes sobre la sintaxis de comandos, operadores o lógica de base de datos? Pregúntame lo que necesites." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/ask-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message || data.error }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Hubo un error de red al contactar al servidor." }]);
    }
    setIsTyping(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-[#0b0f19] border border-fuchsia-500/30 rounded-2xl shadow-[0_0_50px_rgba(217,70,239,0.15)] flex flex-col w-[600px] max-w-full h-[600px] overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-fuchsia-900/30 p-4 flex items-center justify-between bg-fuchsia-950/20">
              <div className="flex items-center gap-2 text-fuchsia-400 font-bold tracking-wider uppercase text-sm">
                <Sparkles size={18} /> Tutor Groq Online
              </div>
              <button onClick={onClose} className="p-2 bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-[#080b12]" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                  <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-fuchsia-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-fuchsia-900/20 border border-fuchsia-500/20 text-fuchsia-100 rounded-tr-none' : 'bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-tl-none'}`}>
                  {m.content.split("\n").map((line, idx) => (
                        <p key={idx}>{line.includes("\`") ? <span dangerouslySetInnerHTML={{ __html: line.replace(/\`(.*?)\`/g, '<code class="bg-black/50 text-emerald-400 px-1 py-0.5 rounded border border-black/50 font-mono text-xs">$1</code>') }} /> : line}</p>
                   ))}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 max-w-[85%] self-start">
                  <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 bg-emerald-600 text-white"><Bot size={16} /></div>
                  <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-tl-none text-sm flex gap-1 items-center">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                className="flex-1 bg-black border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                placeholder="Pregunta sobre algún comando..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button 
                 onClick={handleSend}
                 disabled={isTyping || !input.trim()} 
                 className="p-3 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={18} className={isTyping ? "opacity-50" : "opacity-100"} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
