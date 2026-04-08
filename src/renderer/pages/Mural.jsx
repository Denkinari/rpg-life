import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Mural = ({ onTaskComplete }) => {
  const [tasks, setTasks] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    difficulty: 'Fácil',
    category: '',
  });

  // Busca os dados iniciais
  useEffect(() => {
    const loadData = async () => {
      const tData = await window.api.getTasks();
      const sData = await window.api.getSpecializations();
      // Garante que todas as tarefas antigas que não tenham status ganhem o status 'todo' (Backlog)
      const formattedTasks = (tData || []).map((t) => ({
        ...t,
        status: t.status || 'todo',
      }));
      setTasks(formattedTasks);
      setSpecializations(sData || []);

      if (sData && sData.length > 0) {
        setNewTask((prev) => ({ ...prev, category: sData[0].name }));
      }
    };
    loadData();
  }, []);

  // Adicionar Nova Missão (Vai direto para o Backlog)
  const handleAddTask = async () => {
    if (!newTask.title) return;
    const res = await window.api.addTask(newTask);
    if (res.id) {
      setTasks([
        ...tasks,
        { ...newTask, id: res.id, date: res.date, status: 'todo' },
      ]);
      setNewTask({ ...newTask, title: '' });
    }
  };

  // Excluir manualmente (sem dar XP)
  const handleDelete = async (id) => {
    const res = await window.api.deleteTask(id);
    if (res.success) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  // Cores das Dificuldades
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Trivial':
        return 'text-blue-400 border-blue-400';
      case 'Fácil':
        return 'text-green-400 border-green-400';
      case 'Médio':
        return 'text-yellow-400 border-yellow-400';
      case 'Difícil':
        return 'text-red-400 border-red-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  // O CORAÇÃO DO DRAG & DROP
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Se soltou fora de uma coluna válida, não faz nada
    if (!destination) return;

    // Se soltou no mesmo lugar, não faz nada
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const draggedTask = tasks.find((t) => t.id.toString() === draggableId);

    // SE SOLTOU NA COLUNA "DONE" (CONCLUIR MISSÃO E DAR XP)
    if (destination.droppableId === 'done') {
      const profile = await window.api.getProfile();
      const xpMap = {
        Trivial: profile.xp_trivial,
        Fácil: profile.xp_easy,
        Médio: profile.xp_medium,
        Difícil: profile.xp_hard,
      };
      const xpToGain = xpMap[draggedTask.difficulty] || 10;

      const res = await window.api.addXp({
        xpGained: xpToGain,
        category: draggedTask.category,
      });

      if (res.success) {
        if (res.leveledUp)
          alert(`LEVEL UP! Você alcançou o Nível ${res.newLevel}!`);
        await window.api.deleteTask(draggedTask.id); // Remove do banco
        setTasks(tasks.filter((t) => t.id !== draggedTask.id)); // Remove da tela
        if (onTaskComplete) onTaskComplete(); // Atualiza a barra lateral
      }
      return;
    }

    // SE APENAS MOVEU ENTRE BACKLOG E IN PROGRESS
    const newTasks = Array.from(tasks);
    const taskIndex = newTasks.findIndex((t) => t.id === draggedTask.id);
    newTasks[taskIndex].status = destination.droppableId;

    setTasks(newTasks); // Atualiza a tela instantaneamente
    await window.api.updateTask({
      id: draggedTask.id,
      status: destination.droppableId,
    }); // Salva no banco
  };

  // Colunas do Kanban
  const columns = [
    { id: 'todo', title: 'BACKLOG', color: 'border-gray-500' },
    { id: 'doing', title: 'IN PROGRESS', color: 'border-[#CCFF00]' },
    { id: 'done', title: 'DONE (DROP TO XP)', color: 'border-purple-500' },
  ];

  return (
    <div className="p-8 h-screen flex flex-col space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-[#CCFF00] border-b border-[#CCFF00]/20 pb-2">
        THE MURAL{' '}
        <span className="text-sm font-normal text-gray-400">
          // Painel Tático
        </span>
      </h2>

      {/* PAINEL DE INSERÇÃO */}
      <div className="bg-[#252525] p-4 rounded-lg border-l-4 border-gray-500 shadow-xl flex gap-4 items-end z-20">
        <div className="flex-1">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-widest">
            Título da Missão
          </label>
          <input
            className="w-full bg-[#1A1A1A] border border-gray-700 p-2.5 rounded text-white focus:border-[#CCFF00] outline-none text-sm"
            placeholder="Ex: Estudar 1 hora de Japonês..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          />
        </div>
        <div className="w-40">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-widest">
            Dificuldade
          </label>
          <select
            className="w-full bg-[#1A1A1A] border border-gray-700 p-2.5 rounded text-white outline-none text-sm"
            value={newTask.difficulty}
            onChange={(e) =>
              setNewTask({ ...newTask, difficulty: e.target.value })
            }
          >
            <option value="Trivial">Trivial</option>
            <option value="Fácil">Fácil</option>
            <option value="Médio">Médio</option>
            <option value="Difícil">Difícil</option>
          </select>
        </div>
        <div className="w-48">
          <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-widest">
            Skill Base
          </label>
          <select
            className="w-full bg-[#1A1A1A] border border-gray-700 p-2.5 rounded text-white outline-none text-sm"
            value={newTask.category}
            onChange={(e) =>
              setNewTask({ ...newTask, category: e.target.value })
            }
          >
            {specializations.length === 0 && (
              <option value="">S/ Skill...</option>
            )}
            {specializations.map((spec) => (
              <option key={spec.id} value={spec.name}>
                {spec.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAddTask}
          className="bg-gray-700 hover:bg-gray-600 text-white font-black text-xs py-3 px-6 rounded transition-colors"
        >
          + REGISTRAR
        </button>
      </div>

      {/* O KANBAN EM SI */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col bg-[#0a0a0a] rounded-lg border border-gray-800 relative"
            >
              <h3
                className={`text-center py-3 border-b-2 ${column.color} bg-[#151515] text-[10px] uppercase font-black tracking-[0.2em] text-gray-300 rounded-t-lg`}
              >
                {column.title}
              </h3>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-4 overflow-y-auto space-y-4 transition-colors ${snapshot.isDraggingOver ? 'bg-[#1A1A1A]' : ''}`}
                  >
                    {tasks
                      .filter((t) => t.status === column.id)
                      .map((task, index) => (
                        <Draggable
                          key={task.id.toString()}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-[#1A1A1A] border rounded-md p-4 relative group flex flex-col justify-between min-h-[120px] transition-all shadow-md ${snapshot.isDragging ? 'border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)] z-50' : 'border-gray-700 hover:border-gray-500'}`}
                              style={{ ...provided.draggableProps.style }}
                            >
                              <div
                                className={`absolute -top-2 -right-2 bg-[#151515] px-2 py-0.5 text-[9px] font-black border rounded uppercase tracking-wider ${getDifficultyColor(task.difficulty)}`}
                              >
                                {task.difficulty}
                              </div>

                              <h4 className="text-white font-medium text-sm pr-6 leading-relaxed mb-4">
                                {task.title}
                              </h4>

                              <div className="flex justify-between items-end border-t border-gray-800 pt-3 mt-auto">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400">
                                  {task.category || 'Geral'}
                                </span>

                                {/* O botão excluir vira uma pequena lixeira invisível que aparece no hover para limpar a interface */}
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 text-[10px] font-black uppercase transition-opacity"
                                >
                                  [ X ]
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Mural;
