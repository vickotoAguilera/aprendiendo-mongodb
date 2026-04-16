import { useState } from "react";
import { X, Book, Code2, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const commands = [
  {
    cmd: "use <database>",
    desc: "Cambia el contexto a la base de datos especificada. Si no existe, MongoDB la creará cuando insertes el primer dato.",
    example: "use tiendaonline"
  },
  {
    cmd: "db.createCollection('<name>')",
    desc: "Crea explícitamente una nueva colección en la base de datos actual.",
    example: "db.createCollection('productos')"
  },
  {
    cmd: "db.<collection>.insertOne({ ... })",
    desc: "Inserta un (1) solo documento dentro de la colección.",
    example: "db.clientes.insertOne({ nombre: 'Juan', edad: 25 })"
  },
  {
    cmd: "db.<collection>.insertMany([ ... ])",
    desc: "Inserta varios documentos a la vez. Nota fundamental: Recibe un ARREGLO [] de objetos.",
    example: "db.productos.insertMany([{ item: 'Polo', precio: 20 }, { item: 'Gorra', precio: 15 }])"
  },
  {
    cmd: "db.<collection>.find({ ... })",
    desc: "Busca documentos. Sin llaves devuelve todo; con llaves actúa como filtro.",
    example: "db.clientes.find({ 'direccion.ciudad': 'Bogotá' })"
  },
  {
    cmd: "db.<collection>.find().count()",
    desc: "Devuelve la cantidad de documentos que satisfacen la condición.",
    example: "db.productos.find({ situacion: 'A' }).count()"
  },
  {
    cmd: "db.<collection>.distinct('campo')",
    desc: "Devuelve los valores diferentes (únicos) de cierto campo.",
    example: "db.productos.distinct('precio')"
  },
  {
    cmd: "Búsqueda por Regex /.../",
    desc: "Busca coincidencias parciales de texto (como LIKE en SQL) usando expresiones regulares. Usa la 'i' al final para ignorar mayúsculas.",
    example: "db.productos.find({ nombre: /.*camisa.*/i })"
  },
  {
    cmd: "db.<collection>.updateOne(filter, update)",
    desc: "Actualiza el primer documento que coincida con el filtro. Requiere operadores especiales como $set.",
    example: "db.productos.updateOne({ item: 'Polo' }, { $set: { precio: 25 } })"
  },
  {
    cmd: "db.<collection>.updateMany()",
    desc: "Actualiza TODOS los documentos que coincidan con el filtro.",
    example: "db.personas.updateMany({ sexo: 'M' }, { $set: { sueldo: 600000 } })"
  },
  {
    cmd: "db.<collection>.deleteMany()",
    desc: "Borra TODOS los documentos que cumplen las condiciones.",
    example: "db.libros.deleteMany({ copias: 5 })"
  },
  {
    cmd: "$push",
    desc: "Operador que AGREGA un nuevo elemento al final de un arreglo, exista o no.",
    example: "db.clientes.updateOne({ nombre: 'Juan' }, { $push: { pedidos: { id: 101 } } })"
  },
  {
    cmd: "$addToSet",
    desc: "Agrega un valor a un arreglo SOLO si dicho valor no existe previamente en él.",
    example: "db.ejemplo.updateOne({}, { $addToSet: { escala: 4 } })"
  },
  {
    cmd: "$each / $position / $sort",
    desc: "Modificadores que operan con $push para agregar múltiples valores, en posiciones específicas y ordenarlos.",
    example: "db.ejemplo.updateOne({}, { $push: { escala: { $each: [95, 97], $position: 0, $sort: 1 } } })"
  },
  {
    cmd: "$pull",
    desc: "Operador que ELIMINA un elemento específico de un arreglo si coincide con la condición.",
    example: "db.clientes.updateOne({ nombre: 'Juan' }, { $pull: { pedidos: { id: 101 } } })"
  },
  {
    cmd: "$pullAll",
    desc: "Elimina múltiples valores exactos de un arreglo al mismo tiempo enviando un array de valores.",
    example: "db.ejemplo.updateMany({}, { $pullAll: { escala: [4, 5] } })"
  },
  {
    cmd: "$in / $nin / $all",
    desc: "Operadores lógicos para arrays o múltiples valores: $in (dentro de), $nin (no dentro), $all (deben estar todos).",
    example: "db.ejemplo.find({ escala: { $in: [2, 5] } })"
  },
  {
    cmd: "db.<collection>.bulkWrite([ ... ])",
    desc: "Permite enviar múltiples operaciones (insert, update, delete) en bloque a la base de datos de manera altamente eficiente.",
    example: "db.autores.bulkWrite([{ updateOne: { filter: { nombre: 'Gabo' }, update: { $set: { pais: 'ES' } } } }])"
  }
];

export function GlossaryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState(commands[0]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0b0f19] border border-blue-500/30 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col w-[800px] max-w-full h-[600px] overflow-hidden"
          >
            {/* Header */}
            <div className="border-b border-blue-900/30 p-4 flex items-center justify-between bg-blue-950/20">
              <div className="flex items-center gap-2 text-blue-400 font-bold tracking-wider uppercase text-sm">
                <Book size={18} /> Glosario de Comandos MongoDB
              </div>
              <button onClick={onClose} className="p-2 bg-red-900/40 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left pane: List of commands */}
              <div className="w-1/3 border-r border-blue-900/30 overflow-y-auto custom-scrollbar p-2 bg-[#080b12]">
                {commands.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left p-3 mb-1 rounded-xl text-sm transition-all focus:outline-none ${selected.cmd === c.cmd ? 'bg-blue-600 text-white font-semibold shadow-lg' : 'text-gray-400 hover:bg-blue-900/30 hover:text-blue-300'}`}
                  >
                    <code className="font-mono">{c.cmd.split("(")[0]}</code>
                  </button>
                ))}
              </div>

              {/* Right pane: Details */}
              <div className="flex-1 p-8 flex flex-col justify-center relative overflow-y-auto custom-scrollbar">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500/5 rotate-[-15deg] pointer-events-none">
                  <Database size={300} />
                </div>
                
                <h2 className="text-2xl font-black text-white font-mono mb-6 inline-flex items-center gap-3">
                  <Code2 size={24} className="text-blue-500" />
                  {selected.cmd}
                </h2>
                
                <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-2xl mb-8 relative z-10 backdrop-blur-md">
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold">Concepto Teórico</h3>
                  <p className="text-slate-200 leading-relaxed">{selected.desc}</p>
                </div>

                <div className="bg-blue-950/30 border border-blue-500/20 p-6 rounded-2xl relative z-10 backdrop-blur-md">
                  <h3 className="text-xs uppercase tracking-widest text-blue-400 mb-3 font-bold">Ejemplo Práctico</h3>
                  <code className="block bg-black px-4 py-3 rounded-lg text-emerald-400 font-mono text-sm shadow-inner overflow-x-auto whitespace-nowrap border border-black">
                    {selected.example}
                  </code>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
