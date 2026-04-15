"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./home-client"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-[#09090b] text-gray-200 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-emerald-400 font-semibold tracking-widest uppercase text-xs">
          MongoLearn AI
        </div>
        <div className="text-white text-lg font-bold">Cargando entorno interactivo...</div>
      </div>
    </main>
  ),
});

export default function Page() {
  return <HomeClient />;
}