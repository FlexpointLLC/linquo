const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/support.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  initializeTables() {
    // Create messages table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        content TEXT NOT NULL,
        sender TEXT NOT NULL,
        sender_type TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        socket_id TEXT
      )
    `);

    // Create sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        customer_name TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create agents table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  }

  // Message operations
  async saveMessage(message) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO messages (id, session_id, content, sender, sender_type, timestamp, socket_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        message.id,
        message.sessionId,
        message.content,
        message.sender,
        message.senderType,
        message.timestamp.toISOString(),
        message.socketId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getMessagesBySession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM messages 
        WHERE session_id = ? 
        ORDER BY timestamp ASC
      `, [sessionId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Session operations
  async createSession(sessionId, customerName) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO sessions (id, customer_name, status, updated_at)
        VALUES (?, ?, 'active', CURRENT_TIMESTAMP)
      `);
      
      stmt.run([sessionId, customerName], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getActiveSessions() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM sessions 
        WHERE status = 'active' 
        ORDER BY updated_at DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateSessionStatus(sessionId, status) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE sessions 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [status, sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Agent operations
  async createAgent(agent) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO agents (id, name, email, password_hash)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([agent.id, agent.name, agent.email, agent.passwordHash], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getAgentByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM agents WHERE email = ?
      `, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getAgentById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM agents WHERE id = ?
      `, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;