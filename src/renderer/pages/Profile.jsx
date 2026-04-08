import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    birthdate: '',
    xp_easy: 30,
  });

  const [specializations, setSpecializations] = useState([]);
  const [newSpec, setNewSpec] = useState({
    name: '',
    parent_attribute: 'INT',
    overflow_pct: 20,
  });

  // Busca os dados do banco ao carregar a página
  useEffect(() => {
    const loadData = async () => {
      const pData = await window.api.getProfile();
      const sData = await window.api.getSpecializations();
      if (pData) setProfile(pData);
      setSpecializations(sData || []);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    const res = await window.api.updateProfile(profile);
    if (res.success) alert('Configurações da Engine Salvas!');
  };

  const handleAddSpec = async () => {
    if (!newSpec.name) return;
    const res = await window.api.addSpecialization(newSpec);
    if (res.id) {
      setSpecializations([...specializations, { ...newSpec, id: res.id }]);
      setNewSpec({ name: '', parent_attribute: 'INT', overflow_pct: 20 });
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-[#CCFF00] border-b border-[#CCFF00]/20 pb-2">
        THE ENGINE{' '}
        <span className="text-sm font-normal text-gray-400">
          // Configurações de RPG
        </span>
      </h2>

      {/* Bloco de Ficha */}
      <div className="bg-[#252525] p-6 rounded-lg border-l-4 border-purple-600 shadow-xl">
        <h3 className="text-purple-400 font-bold mb-4">FICHA DO HERÓI</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase text-left">
              Nome do Personagem
            </label>
            <input
              className="w-full bg-[#1A1A1A] border border-gray-700 p-2 rounded text-white focus:border-[#CCFF00] outline-none"
              value={profile.name || ''} /* <--- MUDANÇA AQUI */
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase text-left">
              Nascimento
            </label>
            <input
              type="date"
              className="w-full bg-[#1A1A1A] border border-gray-700 p-2 rounded text-white focus:border-[#CCFF00] outline-none"
              value={profile.birthdate || ''} /* <--- MUDANÇA AQUI */
              onChange={(e) =>
                setProfile({ ...profile, birthdate: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Bloco de XP Balance */}
      <div className="bg-[#252525] p-6 rounded-lg border-l-4 border-[#CCFF00] shadow-xl mt-8">
        <h3 className="text-[#CCFF00] font-bold mb-4 uppercase tracking-widest text-sm">
          XP Balance // Dificuldade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Trivial', key: 'xp_trivial', color: 'text-blue-400' },
            { label: 'Fácil', key: 'xp_easy', color: 'text-green-400' },
            { label: 'Médio', key: 'xp_medium', color: 'text-yellow-400' },
            { label: 'Difícil', key: 'xp_hard', color: 'text-red-400' },
          ].map((item) => (
            <div key={item.key}>
              <label
                className={`block text-[10px] ${item.color} mb-1 uppercase font-black`}
              >
                {item.label}
              </label>
              <div className="flex items-center bg-[#1A1A1A] border border-gray-700 rounded overflow-hidden focus-within:border-[#CCFF00]">
                <span className="pl-3 text-gray-600 text-xs">XP</span>
                <input
                  type="number"
                  className="w-full bg-transparent p-2 text-white outline-none text-sm"
                  value={profile[item.key] || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      [item.key]: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#252525] p-6 rounded-lg border-l-4 border-[#CCFF00] shadow-xl mt-8">
        <h3 className="text-[#CCFF00] font-bold mb-6 uppercase tracking-widest text-sm">
          Mastery Tree // Especializações
        </h3>

        {/* Lista de Especializações Atuais */}
        <div className="space-y-4 mb-8">
          {specializations.map((spec) => {
            // Lógica de XP da Skill (Nível * 500)
            const currentLevel = spec.level || 1;
            const currentXp = spec.xp || 0;
            const xpNeeded = currentLevel * 500;
            const progressPct = Math.min((currentXp / xpNeeded) * 100, 100);

            return (
              <div
                key={spec.id}
                className="flex items-center gap-4 bg-[#1A1A1A] p-4 rounded border border-gray-800 relative overflow-hidden group"
              >
                {/* Indicador de Nível da Skill */}
                <div className="flex items-center justify-center bg-purple-900/40 border border-purple-500/50 text-purple-300 w-10 h-10 rounded-full font-black text-lg shadow-[0_0_10px_rgba(147,51,234,0.2)]">
                  {currentLevel}
                </div>

                <div className="flex-1 z-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white font-bold text-lg">
                      {spec.name}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter border border-gray-700 px-1.5 rounded">
                      Attr: {spec.parent_attribute}
                    </span>
                  </div>

                  {/* Barra de Progresso da Skill */}
                  <div className="mt-2 space-y-1 w-full max-w-md">
                    <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      <span>XP Mastery</span>
                      <span>
                        {currentXp} / {xpNeeded}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-[#CCFF00] transition-all duration-1000 ease-out"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Bloco de Transbordo */}
                <div className="w-32 text-right z-10">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                    Transbordo
                  </div>
                  <div className="text-[#CCFF00] font-black text-lg">
                    {spec.overflow_pct}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formulário para Adicionar Nova */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-[#1f1f1f] p-4 rounded-be-2xl border-t border-gray-800">
          <input
            placeholder="Nome da Skill (ex: Japonês)"
            className="bg-[#121212] border border-gray-700 p-2 rounded text-sm outline-none focus:border-purple-500"
            value={newSpec.name}
            onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
          />
          <select
            className="bg-[#121212] border border-gray-700 p-2 rounded text-sm outline-none"
            value={newSpec.parent_attribute}
            onChange={(e) =>
              setNewSpec({ ...newSpec, parent_attribute: e.target.value })
            }
          >
            <option value="INT">INTELIGÊNCIA</option>
            <option value="VIT">VITALIDADE</option>
            <option value="DEX">DESTREZA</option>
            <option value="WIS">SABEDORIA</option>
          </select>
          <div className="px-2">
            <input
              type="range"
              min="0"
              max="100"
              className="w-full accent-purple-500"
              value={newSpec.overflow_pct}
              onChange={(e) =>
                setNewSpec({
                  ...newSpec,
                  overflow_pct: parseInt(e.target.value),
                })
              }
            />
          </div>
          <button
            onClick={handleAddSpec}
            className="bg-white text-black font-black text-xs p-2 rounded hover:bg-[#CCFF00] transition-all"
          >
            + ADICIONAR À ÁRVORE
          </button>
        </div>
      </div>

      {/* Botão de Ação */}
      <button
        onClick={handleSave}
        className="bg-[#CCFF00] text-black font-bold py-3 px-8 rounded-sm hover:bg-white transition-colors cursor-pointer"
      >
        SALVAR ALTERAÇÕES
      </button>
    </div>
  );
};

export default Profile;
