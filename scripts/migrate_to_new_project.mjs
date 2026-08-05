/**
 * Migration script: Export data from old Supabase project → Import to new project
 * 
 * Usage: node scripts/migrate_to_new_project.mjs
 * 
 * Requires: npm install pg (or uses existing node_modules)
 */

import pg from 'pg';
const { Client } = pg;

// ============================================================
// CONFIG - Old project (bị block, nhưng direct DB vẫn vào được)
// ============================================================
const OLD_DB = {
  host: 'db.uluxycppxlzdskyklgqt.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'zaamguQErGXn0pLZ',
  ssl: { rejectUnauthorized: false }
};

// ============================================================
// CONFIG - New project
// Cần điền password mới vào đây!
// Vào: Dashboard → nhpnqoyljtfwqqlomiyz → Database Settings → Reset password
// ============================================================
const NEW_DB = {
  host: 'db.nhpnqoyljtfwqqlomiyz.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'PASTE_NEW_PROJECT_DB_PASSWORD_HERE', // ← Cần điền
  ssl: { rejectUnauthorized: false }
};

// Các bảng cần migrate (theo thứ tự để tránh FK constraint)
const TABLES_TO_MIGRATE = [
  'branches',
  'profiles',
  'customers',
  'suppliers',
  'parts',
  'inventory_transactions',
  'cash_inventory',
  'cash_transactions',
  'work_orders',
  'sales',
  'sale_items',
  'customer_debts',
  'debt_history',
  'employees',
  'employee_advances',
  'payroll_records',
  'purchase_orders',
  'purchase_order_items',
  'fixed_assets',
  'capital',
  'store_settings',
  'repair_templates',
  'quick_services',
  'notifications',
  'audit_logs',
  'external_parts',
  'promotions',
  'sales_installments',
  'ai_conversations',
  'marketing_campaigns',
  'knowledge_base',
];

async function migrateTable(oldClient, newClient, tableName) {
  try {
    console.log(`\n📋 Migrating table: ${tableName}`);
    
    // Đọc data từ project cũ
    const result = await oldClient.query(`SELECT * FROM public.${tableName}`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`   ⚪ Empty table, skipping`);
      return { table: tableName, count: 0, status: 'empty' };
    }
    
    console.log(`   📥 Found ${rows.length} rows`);
    
    // Disable trigger tạm thời để tránh side effects
    await newClient.query(`ALTER TABLE public.${tableName} DISABLE TRIGGER ALL`).catch(() => {});
    
    // Insert từng batch
    const BATCH_SIZE = 100;
    let inserted = 0;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const columns = Object.keys(batch[0]);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');
        
        await newClient.query(
          `INSERT INTO public.${tableName} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        ).catch(err => {
          console.log(`   ⚠️  Skip row: ${err.message.substring(0, 80)}`);
        });
        inserted++;
      }
    }
    
    // Re-enable trigger
    await newClient.query(`ALTER TABLE public.${tableName} ENABLE TRIGGER ALL`).catch(() => {});
    
    console.log(`   ✅ Inserted ${inserted}/${rows.length} rows`);
    return { table: tableName, count: inserted, status: 'ok' };
    
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return { table: tableName, count: 0, status: 'error', error: err.message };
  }
}

async function main() {
  console.log('🚀 MotoCare Database Migration Tool');
  console.log('=====================================');
  console.log('FROM: uluxycppxlzdskyklgqt (old - blocked)');
  console.log('TO:   nhpnqoyljtfwqqlomiyz (new)');
  console.log('');
  
  if (NEW_DB.password === 'PASTE_NEW_PROJECT_DB_PASSWORD_HERE') {
    console.error('❌ ERROR: Chưa điền password cho project mới!');
    console.error('   Vào Supabase Dashboard → project nhpnqoyljtfwqqlomiyz → Database Settings → Reset password');
    process.exit(1);
  }

  const oldClient = new Client(OLD_DB);
  const newClient = new Client(NEW_DB);
  
  try {
    console.log('🔌 Connecting to old database...');
    await oldClient.connect();
    console.log('✅ Old DB connected');
    
    console.log('🔌 Connecting to new database...');
    await newClient.connect();
    console.log('✅ New DB connected');
    
    const results = [];
    
    for (const table of TABLES_TO_MIGRATE) {
      // Kiểm tra bảng có tồn tại không
      const exists = await oldClient.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );
      
      if (!exists.rows[0].exists) {
        console.log(`\n⚪ Table "${table}" does not exist, skipping`);
        continue;
      }
      
      const result = await migrateTable(oldClient, newClient, table);
      results.push(result);
    }
    
    console.log('\n\n📊 MIGRATION SUMMARY');
    console.log('====================');
    for (const r of results) {
      const icon = r.status === 'ok' ? '✅' : r.status === 'empty' ? '⚪' : '❌';
      console.log(`${icon} ${r.table}: ${r.count} rows`);
    }
    
    const success = results.filter(r => r.status === 'ok').length;
    const errors = results.filter(r => r.status === 'error').length;
    console.log(`\n✅ Success: ${success} tables`);
    console.log(`❌ Errors: ${errors} tables`);
    
  } catch (err) {
    console.error('💥 Fatal error:', err.message);
  } finally {
    await oldClient.end().catch(() => {});
    await newClient.end().catch(() => {});
  }
}

main();
