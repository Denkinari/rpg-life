import React, { useState, useEffect } from 'react';
import Profile from './pages/Profile';
import Mural from './pages/Mural';
import Vault from './pages/Vault';

function App() {
  const [activePage, setActivePage] = useState('mural');
  const [charStatus, setCharStatus] = useState({
    name: 'Carregando...',
    level: 1,
    xp: 0,
  });

  // Função para atualizar o status (nível e barra)
  const refreshStatus = async () => {
    const data = await window.api.getProfile();
    if (data) setCharStatus(data);
  };

  useEffect(() => {
    refreshStatus();
  }, [activePage]); // Recarrega sempre que trocamos de página para garantir sincronia

  // Cálculo da barra de progresso (Nível * 1000)
  const xpNeeded = charStatus.level * 1000;
  const progressPct = (charStatus.xp / xpNeeded) * 100;

  return (
    <div className="h-screen w-screen bg-[#0f0f0f] text-white flex overflow-hidden font-sans">
      {/* SIDEBAR DE NAVEGAÇÃO COM STATUS */}
      <nav className="w-72 bg-[#1A1A1A] border-r border-gray-800 flex flex-col">
        {/* HEADER DO HERÓI (NOVO) */}
        <div className="p-6 border-b border-gray-800 bg-gradient-to-b from-[#1f1f1f] to-[#1A1A1A]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-purple-500 bg-purple-900/30 flex items-center justify-center text-lg font-black shadow-[0_0_10px_rgba(147,51,234,0.4)]">
              {charStatus.level}
            </div>
            <div>
              <h1 className="text-sm font-black text-[#CCFF00] uppercase tracking-tighter leading-none">
                {charStatus.name}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Level {charStatus.level} Editor
              </p>
            </div>
          </div>

          {/* BARRA DE XP */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <span>Progress</span>
              <span>
                {charStatus.xp} / {xpNeeded} XP
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* BOTÕES DO MENU */}
        <div className="flex-1 py-6 space-y-2 px-4">
          <button
            onClick={() => setActivePage('mural')}
            className={`w-full text-left px-4 py-3 rounded text-xs font-black tracking-widest uppercase transition-all ${
              activePage === 'mural'
                ? 'bg-[#CCFF00] text-black'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            The Mural
          </button>
          <button
            onClick={() => setActivePage('vault')}
            className={`w-full text-left px-4 py-3 rounded text-xs font-black tracking-widest uppercase transition-all ${
              activePage === 'vault'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            The Vault
          </button>
          <button
            onClick={() => setActivePage('profile')}
            className={`w-full text-left px-4 py-3 rounded text-xs font-black tracking-widest uppercase transition-all ${
              activePage === 'profile'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            The Engine
          </button>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => window.api.exportDataJSON().then(alert)}
            className="w-full text-[9px] uppercase tracking-[0.2em] text-gray-600 hover:text-[#CCFF00] transition-colors"
          >
            [ Force Backup ]
          </button>
        </div>
      </nav>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        {activePage === 'mural' && <Mural onTaskComplete={refreshStatus} />}
        {activePage === 'vault' && <Vault />}
        {activePage === 'profile' && <Profile />}
      </main>
    </div>
  );
}

export default App;
