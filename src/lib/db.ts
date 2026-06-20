import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { SEED_ASSETS, SEED_TECHNICIANS, SEED_WORK_ORDERS } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "shiftsage.db");

let db: Database.Database | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      line TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running'
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      shift TEXT NOT NULL,
      years_experience INTEGER NOT NULL,
      retirement_risk INTEGER NOT NULL,
      specialty TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      wo_number TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      technician_name TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      fault_code TEXT,
      description TEXT NOT NULL,
      technician_notes TEXT NOT NULL,
      resolution TEXT NOT NULL,
      downtime_minutes INTEGER NOT NULL,
      is_workaround INTEGER NOT NULL DEFAULT 0,
      workaround_label TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (technician_id) REFERENCES technicians(id)
    );

    CREATE INDEX IF NOT EXISTS idx_wo_asset ON work_orders(asset_id);
    CREATE INDEX IF NOT EXISTS idx_wo_technician ON work_orders(technician_id);
    CREATE INDEX IF NOT EXISTS idx_wo_workaround ON work_orders(is_workaround);
  `);
}

function seedDatabase(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) as c FROM work_orders").get() as { c: number };
  if (count.c > 0) return;

  const insertAsset = database.prepare(
    "INSERT INTO assets (id, name, line, status) VALUES (@id, @name, @line, @status)"
  );
  const insertTech = database.prepare(
    "INSERT INTO technicians (id, name, shift, years_experience, retirement_risk, specialty) VALUES (@id, @name, @shift, @years_experience, @retirement_risk, @specialty)"
  );
  const insertWO = database.prepare(`
    INSERT INTO work_orders (
      id, wo_number, asset_id, asset_name, technician_id, technician_name,
      date, type, status, fault_code, description, technician_notes,
      resolution, downtime_minutes, is_workaround, workaround_label
    ) VALUES (
      @id, @wo_number, @asset_id, @asset_name, @technician_id, @technician_name,
      @date, @type, @status, @fault_code, @description, @technician_notes,
      @resolution, @downtime_minutes, @is_workaround, @workaround_label
    )
  `);

  const tx = database.transaction(() => {
    for (const a of SEED_ASSETS) insertAsset.run(a);
    for (const t of SEED_TECHNICIANS) insertTech.run(t);
    for (const w of SEED_WORK_ORDERS) insertWO.run(w);
  });
  tx();
}

export function getDb(): Database.Database {
  if (db) return db;
  ensureDataDir();
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  seedDatabase(db);
  return db;
}

export function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  getDb();
}
