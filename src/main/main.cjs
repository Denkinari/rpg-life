const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, db } = require('./database.cjs');

function createWindow() {
  // Inicializa o banco assim que a janela é criada
  initDatabase();

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1A1A1A',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // ISSO FORÇA O ELECTRON A BUSCAR SEMPRE O CSS NOVO
  win.webContents.session.clearCache();
  win.webContents.on('did-finish-load', () => {
  win.webContents.setZoomLevel(0);
  }); // Só para garantir que o zoom não quebre o layout


  const isDev = !app.isPackaged;

  win.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, '..', '..', 'dist', 'index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools();
  }
}

// --- HANDLERS DE COMUNICAÇÃO (IPC) ---

// 1. Buscar Perfil
ipcMain.handle('db:get-profile', async () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM profile WHERE id = 1", (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
});

// 2. Atualizar Perfil (Cofre blindado contra desajustes de quantidade)
ipcMain.handle('db:update-profile', async (event, data) => {
  return new Promise((resolve, reject) => {
    // 1. Garantimos que todas as variáveis tenham um valor (fallback)
    const name = data.name || '';
    const birthdate = data.birthdate || '';
    const xp_trivial = data.xp_trivial || 10;
    const xp_easy = data.xp_easy || 30;
    const xp_medium = data.xp_medium || 60;
    const xp_hard = data.xp_hard || 120;

    // 2. Temos exatos 6 pontos de interrogação (?)
    const sql = `UPDATE profile SET 
                  name = ?, 
                  birthdate = ?, 
                  xp_trivial = ?, 
                  xp_easy = ?, 
                  xp_medium = ?, 
                  xp_hard = ? 
                WHERE id = 1`;
    
// 3. E exatos 6 itens no array, na MESMA ordem!
    db.run(sql, [name, birthdate, xp_trivial, xp_easy, xp_medium, xp_hard], function(err) {
      if (err) {
        console.error("Erro no Update:", err.message);
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
});

// 3. Buscar Especializações
ipcMain.handle('db:get-specializations', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM specializations", (err, rows) => {
      if (err) reject(err);
      resolve(rows || []);
    });
  });
});

// 4. Adicionar Especialização
ipcMain.handle('db:add-specialization', async (event, data) => {
  return new Promise((resolve, reject) => {
    const { name, parent_attribute, overflow_pct } = data;
    db.run(
      "INSERT INTO specializations (name, parent_attribute, overflow_pct) VALUES (?, ?, ?)",
      [name, parent_attribute, overflow_pct],
      function(err) {
        if (err) reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
});

// 5. Exportar JSON (Backup)
ipcMain.handle('db:export-json', async () => {
  const tables = ['profile', 'specializations', 'mural_tasks', 'finances'];
  let backupData = {};

  for (const table of tables) {
    backupData[table] = await new Promise((resolve) => {
      db.all(`SELECT * FROM ${table}`, (err, rows) => resolve(rows || []));
    });
  }

  const backupPath = path.join(app.getPath('desktop'), 'backup_dashboard_rpg.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  return `Backup salvo na Área de Trabalho!`;
});

// ==========================================
// HANDLERS DO MURAL (MISSÕES)
// ==========================================

// 1. Buscar todas as Missões
ipcMain.handle('db:get-tasks', async () => {
  return new Promise((resolve, reject) => {
    // Busca todas as tarefas (podemos filtrar depois por status, se quiser)
    db.all("SELECT * FROM mural_tasks", (err, rows) => {
      if (err) reject(err);
      resolve(rows || []);
    });
  });
});

// 2. Adicionar nova Missão
ipcMain.handle('db:add-task', async (event, data) => {
  return new Promise((resolve, reject) => {
    const { title, difficulty, category } = data;
    const date = new Date().toISOString(); 
    const status = 'todo'; // <--- ISSO FAZ A MISSÃO NASCER NO BACKLOG
    
    db.run(
      "INSERT INTO mural_tasks (title, difficulty, category, date, status) VALUES (?, ?, ?, ?, ?)",
      [title, difficulty, category, date, status],
      function(err) {
        if (err) {
          console.error("Erro ao inserir task:", err.message);
          reject(err);
        }
        resolve({ id: this.lastID, date, status }); 
      }
    );
  });
});

// 3. Atualizar Missão 
ipcMain.handle('db:update-task', async (event, data) => {
  return new Promise((resolve, reject) => {
    const { id, status } = data; // status será: 'todo', 'doing' ou 'done'
    
    db.run(
      "UPDATE mural_tasks SET status = ? WHERE id = ?",
      [status, id],
      function(err) {
        if (err) {
          console.error("Erro ao atualizar tarefa:", err.message);
          reject(err);
        }
        resolve({ success: true });
      }
    );
  });
});

// 4. Deletar Missão (Caso crie errado)
ipcMain.handle('db:delete-task', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM mural_tasks WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      resolve({ success: true });
    });
  });
});

// ==========================================
// HANDLERS DO FINANCEIRO (THE VAULT)
// ==========================================

// 1. Buscar todo o histórico financeiro
ipcMain.handle('db:get-finances', async () => {
  return new Promise((resolve, reject) => {
    // ORDER BY id DESC faz com que as mais recentes apareçam no topo
    db.all("SELECT * FROM finances ORDER BY id DESC", (err, rows) => {
      if (err) reject(err);
      resolve(rows || []);
    });
  });
});

// 2. Adicionar nova transação
ipcMain.handle('db:add-transaction', async (event, data) => {
  return new Promise((resolve, reject) => {
    const { description, amount, category, type } = data;
    const date = new Date().toISOString(); 
    
    db.run(
      "INSERT INTO finances (description, amount, category, type, date) VALUES (?, ?, ?, ?, ?)",
      [description, amount, category, type, date],
      function(err) {
        if (err) reject(err);
        resolve({ id: this.lastID, date });
      }
    );
  });
});

// 3. Deletar transação (Caso digite o valor errado)
ipcMain.handle('db:delete-transaction', async (event, id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM finances WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      resolve({ success: true });
    });
  });
});

// ==========================================
// SISTEMA DE LEVEL UP E DISTRIBUIÇÃO DE XP
// ==========================================

// Função interna (matemática) para calcular o XP necessário para o próximo nível
// Fórmula clássica de RPG: Nível atual * 1000 (Ex: Lvl 1 precisa de 1000 XP para o Lvl 2)
function getXpForNextLevel(currentLevel) {
  return currentLevel * 1000; 
}

ipcMain.handle('db:add-xp', async (event, data) => {
  return new Promise((resolve, reject) => {
    const { xpGained, category } = data; // category é o nome da Skill (ex: 'Japonês')

    // 1. Busca os dados da Skill e do Perfil simultaneamente
    db.get("SELECT * FROM specializations WHERE name = ?", [category], (err, spec) => {
      if (err) return reject(err);

      // Se a missão tiver uma skill vinculada, calculamos o transbordo
      const overflowPct = spec ? spec.overflow_pct : 100; // Se não tiver skill, 100% vai pro global
      const globalXpGained = Math.round(xpGained * (overflowPct / 100));

      // 2. Atualiza o XP da Especialização (se existir)
      if (spec) {
        let sXp = spec.xp + xpGained;
        let sLvl = spec.level;
        let sNeeded = sLvl * 500; // Skills sobem mais rápido que o Global

        while (sXp >= sNeeded) {
          sXp -= sNeeded;
          sLvl += 1;
          sNeeded = sLvl * 500;
        }
        db.run("UPDATE specializations SET level = ?, xp = ? WHERE id = ?", [sLvl, sXp, spec.id]);
      }

      // 3. Atualiza o XP Global do Perfil
      db.get("SELECT level, xp FROM profile WHERE id = 1", (err, profile) => {
        let nXp = profile.xp + globalXpGained;
        let nLvl = profile.level;
        let nNeeded = nLvl * 1000;
        let leveledUp = false;

        while (nXp >= nNeeded) {
          nXp -= nNeeded;
          nLvl += 1;
          leveledUp = true;
          nNeeded = nLvl * 1000;
        }

        db.run("UPDATE profile SET level = ?, xp = ? WHERE id = 1", [nLvl, nXp], () => {
          resolve({ success: true, newLevel: nLvl, leveledUp });
        });
      });
    });
  });
});

// --- CICLO DE VIDA DO APP ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});