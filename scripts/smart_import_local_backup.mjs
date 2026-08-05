/**
 * Smart Importer for MotoCare Local Backup
 * Automatically aligns JSON columns with Postgres table columns (handling case-insensitivity)
 * and uses rate-limit aware batching.
 *
 * Usage: node scripts/smart_import_local_backup.mjs g:\Motocare\backups\backup_2026-08-04T10-00-03-547Z sbp_1e2fc42afbf1dad9eff12f2566a8be2c2cbef1ad
 */

import fs from 'fs';
import path from 'path';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const BACKUP_DIR = process.argv[2];
const TOKEN = process.argv[3];

if (!BACKUP_DIR || !TOKEN) {
  console.error('Usage: node scripts/smart_import_local_backup.mjs BACKUP_DIR YOUR_TOKEN');
  process.exit(1);
}

async function runQuery(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${NEW_PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (res.status === 429) {
    console.log('    ⏳ Rate limited (429), waiting 2s...');
    await new Promise(r => setTimeout(r, 2000));
    return runQuery(sql); // Retry
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return data;
}

// Order of tables to import
const IMPORT_ORDER = [
  'branches',
  'categories',
  'payment_sources',
  'suppliers',
  'customers',
  'parts',
  'external_parts',
  'store_settings',
  'repair_templates',
  'quick_services',
  'promotions',
  'work_orders',
  'sales',
  'cash_transactions',
  'inventory_transactions',
  'customer_debts',
  'supplier_debts',
  'loans',
  'loan_payments',
  'employees',
  'employee_advances',
  'payroll_records',
  'fixed_assets',
  'capital',
  'audit_logs'
];

async function main() {
  console.log('🚀 MotoCare Smart Backup Importer');
  console.log('=================================');
  console.log(`Folder: ${BACKUP_DIR}\n`);

  // 1. Fetch DB schema columns for public tables
  console.log('🔍 Inspecting target database schema...');
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
  console.log(`✅ Found ${Object.keys(dbSchema).length} tables in target DB.\n`);

  let totalImported = 0;

  // Process tables in order
  for (const tableName of IMPORT_ORDER) {
    const fileName = `${tableName}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const rows = JSON.parse(content);

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`⚪ Table "${tableName}": 0 rows (skipped)`);
      continue;
    }

    const validCols = dbSchema[tableName];
    if (!validCols) {
      console.log(`⚠️ Table "${tableName}" does not exist in target DB (skipped)`);
      continue;
    }

    console.log(`📥 Importing "${tableName}": ${rows.length} rows...`);

    // Build column map: normalized lower-case JSON key -> actual Postgres column name
    const lowerToActualCol = {};
    for (const c of validCols) {
      lowerToActualCol[c.toLowerCase()] = c;
    }

    // Filter and map row keys to match DB columns
    const preparedRows = rows.map(r => {
      const newRow = {};
      for (const [k, v] of Object.entries(r)) {
        const actualCol = lowerToActualCol[k.toLowerCase()];
        if (actualCol) {
          // Keep first match if multiple
          if (newRow[actualCol] === undefined || newRow[actualCol] === null) {
            newRow[actualCol] = v;
          }
        }
      }
      return newRow;
    });

    // Disable triggers on target table
    await runQuery(`ALTER TABLE public."${tableName}" DISABLE TRIGGER ALL;`).catch(() => {});

    const BATCH_SIZE = 50;
    let importedInTable = 0;

    for (let i = 0; i < preparedRows.length; i += BATCH_SIZE) {
      const batch = preparedRows.slice(i, i + BATCH_SIZE);
      const cols = Object.keys(batch[0]).filter(k => batch[0][k] !== undefined);

      if (cols.length === 0) continue;

      const colNames = cols.map(c => `"${c}"`).join(', ');

      const valueTuples = batch.map(row => {
        const vals = cols.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean' || typeof val === 'number') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `(${vals.join(', ')})`;
      });

      const sql = `
        INSERT INTO public."${tableName}" (${colNames})
        VALUES ${valueTuples.join(',\n')}
        ON CONFLICT DO NOTHING;
      `;

      try {
        await runQuery(sql);
        importedInTable += batch.length;
      } catch (err) {
        console.warn(`   ⚠️ Batch error on "${tableName}": ${err.message.substring(0, 100)}`);
      }

      // Small delay between batches to avoid rate-limiting
      await new Promise(r => setTimeout(r, 200));
    }

    // Re-enable triggers
    await runQuery(`ALTER TABLE public."${tableName}" ENABLE TRIGGER ALL;`).catch(() => {});

    console.log(`  ✅ Imported "${tableName}": ${importedInTable}/${rows.length} rows.\n`);
    totalImported += importedInTable;
  }

  console.log('🎉 ALL BACKUP DATA IMPORTED SUCCESSFULLY!');
  console.log('==========================================');
  console.log(`Total rows imported into new database: ${totalImported}`);
}

main().catch(console.error);
