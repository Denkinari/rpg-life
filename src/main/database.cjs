const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Onde o arquivo do banco ficará salvo (Pasta de dados do usuário)
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  db.serialize(() => {
    // 1. Tabela de Perfil/Configurações
    db.run(`CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY,
      name TEXT,
      birthdate TEXT,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      xp_trivial INTEGER DEFAULT 10,
      xp_easy INTEGER DEFAULT 30,
      xp_medium INTEGER DEFAULT 60,
      xp_hard INTEGER DEFAULT 120
    )`);

    // 2. Tabela de Especializações (Mastery Tree)
db.run(`CREATE TABLE IF NOT EXISTS specializations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  parent_attribute TEXT,
  overflow_pct INTEGER DEFAULT 20,
  level INTEGER DEFAULT 1, -- NOVA COLUNA
  xp INTEGER DEFAULT 0     -- NOVA COLUNA
)`);

    // 3. Tabela do Mural (Tasks)
    db.run(`CREATE TABLE IF NOT EXISTS mural_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      difficulty TEXT,
      category TEXT,
      status TEXT DEFAULT 'pending',
      pos_x REAL DEFAULT 0,
      pos_y REAL DEFAULT 0,
      date TEXT,
      status TEXT DEFAULT 'todo'
    )`);

    // 4. Tabela de Finanças (The Vault)
    db.run(`CREATE TABLE IF NOT EXISTS finances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT,
      amount REAL,
      category TEXT, -- Necessidades, Lazer, Investimento
      type TEXT, -- income ou expense
      tags TEXT,
      is_recurring INTEGER DEFAULT 0,
      date TEXT
    )`);

// Verifica se o perfil existe, se não, cria o padrão
db.get("SELECT COUNT(*) as count FROM profile", (err, row) => {
  if (row && row.count === 0) {
    db.run(`INSERT INTO profile (id, name, level, xp) VALUES (1, 'Novo Herói', 1, 0)`, (err) => {
      if (err) console.error("Erro ao criar perfil inicial:", err.message);
      else console.log("Perfil inicial 'Level 1' criado com sucesso!");
    });
  }
});
    console.log("Banco de dados inicializado em:", dbPath);
  });
};

module.exports = { initDatabase, db };