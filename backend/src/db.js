import pg from 'pg';
const { Pool } = pg;
let pool;

export async function connectDB() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connected');
    await runMigrations(client);
  } finally {
    client.release();
  }
}

async function runMigrations(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id          SERIAL PRIMARY KEY,
      title       TEXT        NOT NULL,
      description TEXT,
      completed   BOOLEAN     NOT NULL DEFAULT FALSE,
      priority    TEXT        NOT NULL DEFAULT 'MEDIUM'
                    CHECK (priority IN ('LOW','MEDIUM','HIGH')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS todos_updated_at ON todos;
    CREATE TRIGGER todos_updated_at
      BEFORE UPDATE ON todos
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
  console.log('Migrations applied');
}

export { pool as db };
export async function query(text, params) { return pool.query(text, params); }
