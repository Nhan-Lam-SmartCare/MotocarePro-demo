import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const TOKEN = process.env.SUPABASE_PERSONAL_ACCESS_TOKEN || process.argv[3];
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

if (!SUPABASE_URL || !TOKEN) {
  console.error("❌ Error: Missing VITE_SUPABASE_URL in .env or SUPABASE_PERSONAL_ACCESS_TOKEN.");
  console.error("Usage: npm run db:restore [path_to_backup_folder] [personal_access_token]");
  process.exit(1);
}

// Extract project ref from URL (e.g. https://xxx.supabase.co -> xxx)
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

// Find backup directory: either command line arg or latest folder in /backups
let backupDir = process.argv[2];
if (!backupDir) {
  const backupsBaseDir = path.join(__dirname, "..", "..", "backups");
  if (!fs.existsSync(backupsBaseDir)) {
    console.error("❌ No backups folder found.");
    process.exit(1);
  }
  const folders = fs
    .readdirSync(backupsBaseDir)
    .filter((f) => f.startsWith("backup_"))
    .sort()
    .reverse();

  if (folders.length === 0) {
    console.error("❌ No backup folders found in /backups.");
    process.exit(1);
  }
  backupDir = path.join(backupsBaseDir, folders[0]);
}

async function runQuery(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (res.status === 429) {
    console.log("    ⏳ Rate limited (429), waiting 2s...");
    await new Promise((r) => setTimeout(r, 2000));
    return runQuery(sql);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return data;
}

const IMPORT_ORDER = [
  "branches",
  "categories",
  "payment_sources",
  "suppliers",
  "customers",
  "parts",
  "store_settings",
  "work_orders",
  "sales",
  "cash_transactions",
  "inventory_transactions",
  "customer_debts",
  "supplier_debts",
];

async function main() {
  console.log("🚀 MotoCare Database Restore Tool");
  console.log("=================================");
  console.log(`Target Project: ${projectRef}`);
  console.log(`Backup Folder: ${backupDir}\n`);

  console.log("🔍 Inspecting target database schema...");
  const schemaRows = await runQuery(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public';
  `);

  const dbSchema = {};
  for (const r of schemaRows) {
    if (!dbSchema[r.table_name]) dbSchema[r.table_name] = [];
    dbSchema[r.table_name].push(r.column_name);
  }

  let totalImported = 0;

  for (const tableName of IMPORT_ORDER) {
    const fileName = `${tableName}.json`;
    const filePath = path.join(backupDir, fileName);

    if (!fs.existsSync(filePath)) continue;

    const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const validCols = dbSchema[tableName];
    if (!validCols) continue;

    const lowerToActualCol = {};
    for (const c of validCols) {
      lowerToActualCol[c.toLowerCase()] = c;
    }

    const preparedRows = rows.map((r) => {
      const newRow = {};
      for (const [k, v] of Object.entries(r)) {
        const actualCol = lowerToActualCol[k.toLowerCase()];
        if (actualCol) {
          if (newRow[actualCol] === undefined || newRow[actualCol] === null) {
            newRow[actualCol] = v;
          }
        }
      }
      return newRow;
    });

    await runQuery(`ALTER TABLE public."${tableName}" DISABLE TRIGGER ALL;`).catch(() => {});

    const BATCH_SIZE = 50;
    let importedInTable = 0;

    for (let i = 0; i < preparedRows.length; i += BATCH_SIZE) {
      const batch = preparedRows.slice(i, i + BATCH_SIZE);
      const cols = Object.keys(batch[0]).filter((k) => batch[0][k] !== undefined);
      if (cols.length === 0) continue;

      const colNames = cols.map((c) => `"${c}"`).join(", ");
      const valueTuples = batch.map((row) => {
        const vals = cols.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "boolean" || typeof val === "number") return val;
          if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `(${vals.join(", ")})`;
      });

      const sql = `
        INSERT INTO public."${tableName}" (${colNames})
        VALUES ${valueTuples.join(",\n")}
        ON CONFLICT DO NOTHING;
      `;

      try {
        await runQuery(sql);
        importedInTable += batch.length;
      } catch (err) {
        console.warn(`   ⚠️ Batch notice on "${tableName}": ${err.message.substring(0, 80)}`);
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    await runQuery(`ALTER TABLE public."${tableName}" ENABLE TRIGGER ALL;`).catch(() => {});
    console.log(`  ✅ Restored "${tableName}": ${importedInTable}/${rows.length} rows.`);
    totalImported += importedInTable;
  }

  console.log(`\n🎉 RESTORE COMPLETED! Total records restored: ${totalImported}`);
}

main().catch(console.error);
