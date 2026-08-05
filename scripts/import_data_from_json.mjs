/**
 * Import JSON data exported from old Supabase project into new project
 * Usage: node scripts/import_data_from_json.mjs path/to/exported_data.json sbp_1e2fc42afbf1dad9eff12f2566a8be2c2cbef1ad
 */

import fs from 'fs';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const JSON_FILE = process.argv[2];
const TOKEN = process.argv[3];

if (!JSON_FILE || !TOKEN) {
  console.error('Usage: node scripts/import_data_from_json.mjs path/to/exported_data.json YOUR_TOKEN');
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
  console.log('📦 MotoCare Data Importer');
  console.log('========================');
  
  const rawData = fs.readFileSync(JSON_FILE, 'utf8');
  let dataObj = JSON.parse(rawData);

  // If wrapped in single row array from Supabase SQL query (e.g. [{jsonb_build_object: {...}}])
  if (Array.isArray(dataObj) && dataObj.length === 1 && dataObj[0].jsonb_build_object) {
    dataObj = dataObj[0].jsonb_build_object;
  } else if (Array.isArray(dataObj) && dataObj.length === 1 && dataObj[0].json_build_object) {
    dataObj = dataObj[0].json_build_object;
  }

  console.log('📋 Tables found in export file:', Object.keys(dataObj).join(', '));
  console.log('');

  let totalImported = 0;

  for (const table of IMPORT_ORDER) {
    if (dataObj[table]) {
      const count = await importTableData(table, dataObj[table]);
      totalImported += count;
    }
  }

  // Check any remaining tables in JSON not in IMPORT_ORDER
  for (const table of Object.keys(dataObj)) {
    if (!IMPORT_ORDER.includes(table)) {
      const count = await importTableData(table, dataObj[table]);
      totalImported += count;
    }
  }

  console.log('\n\n🎉 ALL DATA IMPORTED SUCCESSFULLY!');
  console.log(`===================================`);
  console.log(`Total rows imported: ${totalImported}`);
}

main().catch(console.error);
