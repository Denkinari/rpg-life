const { contextBridge, ipcRenderer } = require('electron');

// Expondo APIS seguras para o React (Renderer)
contextBridge.exposeInMainWorld('api', {
  // Funções de Perfil
  getProfile: () => ipcRenderer.invoke('db:get-profile'),
  updateProfile: (data) => ipcRenderer.invoke('db:update-profile', data),

  // Funções de Finanças
  getFinances: () => ipcRenderer.invoke('db:get-finances'),
  addTransaction: (data) => ipcRenderer.invoke('db:add-transaction', data),

  getSpecializations: () => ipcRenderer.invoke('db:get-specializations'),
  addSpecialization: (data) =>
    ipcRenderer.invoke('db:add-specialization', data),

  // Funções do Mural
  getTasks: () => ipcRenderer.invoke('db:get-tasks'),
  addTask: (data) => ipcRenderer.invoke('db:add-task', data),
  updateTask: (data) => ipcRenderer.invoke('db:update-task', data),
  deleteTask: (id) => ipcRenderer.invoke('db:delete-task', id),

  // Funções do Financeiro
  getFinances: () => ipcRenderer.invoke('db:get-finances'),
  addTransaction: (data) => ipcRenderer.invoke('db:add-transaction', data),
  deleteTransaction: (id) => ipcRenderer.invoke('db:delete-transaction', id),

  // Funções de Nível
  addXp: (data) => ipcRenderer.invoke('db:add-xp', data),

  // Funções de Backup/Export (Sua segurança extra)
  exportDataJSON: () => ipcRenderer.invoke('db:export-json'),
});
