-- =====================================================================
-- Rifa Solidária da Amélia — Schema do banco de dados (Cloudflare D1)
-- =====================================================================
-- Rode com:
--   wrangler d1 execute rifa-amelia --local  --file=./schema.sql   (dev)
--   wrangler d1 execute rifa-amelia --remote --file=./schema.sql   (produção)
-- É idempotente: pode ser executado novamente sem apagar dados.

-- Configurações editáveis pelo painel (armazenadas como pares chave/valor em JSON).
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,            -- JSON
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Participantes (compradores de números).
CREATE TABLE IF NOT EXISTS participants (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  whatsapp     TEXT NOT NULL,
  total_cents  INTEGER NOT NULL DEFAULT 0,  -- valor total em centavos
  status       TEXT NOT NULL DEFAULT 'pendente', -- pendente | pago | cancelado
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT
);

-- Números da rifa (um registro por número, 1..N).
-- status: disponivel | reservado | pago | bloqueado
CREATE TABLE IF NOT EXISTS numbers (
  n              INTEGER PRIMARY KEY,
  status         TEXT NOT NULL DEFAULT 'disponivel',
  participant_id INTEGER,
  reserved_at    TEXT,
  paid_at        TEXT,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_numbers_status      ON numbers(status);
CREATE INDEX IF NOT EXISTS idx_numbers_participant ON numbers(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- Administrador (apenas o hash da senha é armazenado; nunca o texto puro).
CREATE TABLE IF NOT EXISTS admin (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  password_hash TEXT,                 -- "pbkdf2$<iter>$<saltB64>$<hashB64>"
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  failed_count  INTEGER NOT NULL DEFAULT 0,
  locked_until  TEXT
);
INSERT OR IGNORE INTO admin (id, password_hash) VALUES (1, NULL);

-- Histórico de ações administrativas (auditoria/transparência).
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
