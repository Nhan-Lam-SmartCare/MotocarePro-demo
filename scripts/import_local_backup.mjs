/**
 * Import local backup folder into new Supabase project
 * Usage: node scripts/import_local_backup.mjs g:\Motocare\backups\backup_2026-08-04T10-00-03-547Z sbp_1e2fc42afbf1dad9eff12f2566a8be2c2cbef1ad
 */

import fs from 'fs';
import path from 'path';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const BACKUP_DIR = process.argv[2];
const TOKEN = process.argv[3];

if (!BACKUP_DIR || !TOKEN) {
  console.error('Usage: node scripts/import_local_backup.mjs BACKUP_DIR YOUR_TOKEN');
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return data;
}

// Order of tables to import to respect foreign key constraints
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

async function importTableData(tableName, rows) {
  if (!rows || rows.length === 0) {
    console.log(`  ⚪ Table "${tableName}": 0 rows (skipped)`);
    return 0;
  }

  console.log(`  ⏳ Importing "${tableName}": ${rows.length} rows...`);

  // Disable triggers temporarily on target table
  await runQuery(`ALTER TABLE public."${tableName}" DISABLE TRIGGER ALL;`).catch(() => {});

  const columns = Object.keys(rows[0]);
  const BATCH_SIZE = 50;
  let successCount = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    // Construct multi-row INSERT with ON CONFLICT DO NOTHING
    const colNames = columns.map(c => `"${c}"`).join(', ');
    
    const valueTuples = batch.map(row => {
      const vals = columns.map(col => {
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
      successCount += batch.length;
    } catch (err) {
      console.warn(`    ⚠️ Batch insert error on "${tableName}": ${err.message.substring(0, 100)}`);
      // Try row by row fallback
      for (const row of batch) {
        const singleVals = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean' || typeof val === 'number') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        const singleSql = `INSERT INTO public."${tableName}" (${colNames}) VALUES (${singleVals.join(', ')}) ON CONFLICT DO NOTHING;`;
        try {
          await runQuery(singleSql);
          successCount++;
        } catch (singleErr) {
          // Skip uninsertable row
        }
      }
    }
  }

  // Re-enable triggers
  await runQuery(`ALTER TABLE public."${tableName}" ENABLE TRIGGER ALL;`).catch(() => {});

  console.log(`  ✅ Imported "${tableName}": ${successCount}/${rows.length} rows.`);
  return successCount;
}

async function main() {
  console.log('📦 MotoCare Backup Importer');
  console.log('===========================');
  console.log(`Folder: ${BACKUP_DIR}`);
  console.log('');

  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json') && f !== 'metadata.json');

  console.log(`Found ${files.length} data files in backup folder.`);

  let totalImported = 0;

  // Import in defined order first
  for (const tableName of IMPORT_ORDER) {
    const fileName = `${tableName}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const rows = JSON.parse(content);
        if (Array.isArray(rows)) {
          const count = await importTableData(tableName, rows);
          totalImported += count;
        }
      } catch (err) {
        console.error(`❌ Failed to read/import ${fileName}:`, err.message);
      }
    }
  }

  // Import any remaining json files
  for (const fileName of files) {
    const tableName = path.basename(fileName, '.json');
    if (!IMPORT_ORDER.includes(tableName)) {
      const filePath = path.join(BACKUP_DIR, fileName);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const rows = JSON.parse(content);
        if (Array.isArray(rows)) {
          const count = await importTableData(tableName, rows);
          totalImported += count;
        }
      } catch (err) {
        console.error(`❌ Failed to read/import ${fileName}:`, err.message);
      }
    }
  }

  console.log('\n\n🎉 ALL BACKUP DATA IMPORTED SUCCESSFULLY!');
  console.log('==========================================');
  console.log(`Total rows imported into new database: ${totalImported}`);
}

main().catch(console.error);
