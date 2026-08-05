/**
 * Apply schema lên Supabase project mới qua Management API
 * (không cần Docker, không cần pg_dump, không cần psql)
 * 
 * Usage: node scripts/apply_schema_to_new_project.mjs YOUR_PERSONAL_ACCESS_TOKEN
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const SQL_DIR = path.join(__dirname, '..', 'sql');
const PERSONAL_ACCESS_TOKEN = process.argv[2];

if (!PERSONAL_ACCESS_TOKEN) {
  console.error('❌ Usage: node scripts/apply_schema_to_new_project.mjs YOUR_PERSONAL_ACCESS_TOKEN');
  console.error('   Get token from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

async function runSQL(sql, label) {
  const url = `https://api.supabase.com/v1/projects/${NEW_PROJECT_REF}/database/query`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return { ok: false, error: data.message || JSON.stringify(data) };
    }
    
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Lấy danh sách SQL migration files theo thứ tự
function getSortedMigrationFiles() {
  return fs.readdirSync(SQL_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}_/) && f.endsWith('.sql'))
    .sort();
}

async function main() {
  console.log('🚀 MotoCare Schema Migration via Supabase Management API');
  console.log('=========================================================');
  console.log(`📍 Target: ${NEW_PROJECT_REF}`);
  console.log('');
  
  // Test token trước
  const testRes = await fetch(`https://api.supabase.com/v1/projects/${NEW_PROJECT_REF}`, {
    headers: { 'Authorization': `Bearer ${PERSONAL_ACCESS_TOKEN}` }
  });
  
  if (!testRes.ok) {
    console.error('❌ Token không hợp lệ hoặc không có quyền truy cập project!');
    console.error('   Kiểm tra token tại: https://supabase.com/dashboard/account/tokens');
    process.exit(1);
  }
  
  const project = await testRes.json();
  console.log(`✅ Connected to project: ${project.name}`);
  console.log('');
  
  // Enable extensions
  console.log('📦 Enabling extensions...');
  await runSQL(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  `, 'extensions');
  
  const files = getSortedMigrationFiles();
  console.log(`📋 Running ${files.length} migration files...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const file of files) {
    const filePath = path.join(SQL_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    process.stdout.write(`  ${file}... `);
    
    const result = await runSQL(sql, file);
    
    if (result.ok) {
      console.log('✅');
      successCount++;
    } else {
      // Nhiều lỗi là bình thường (duplicate objects, etc.)
      const isExpected = result.error.includes('already exists') || 
                         result.error.includes('does not exist') ||
                         result.error.includes('duplicate');
      
      if (isExpected) {
        console.log('⚠️  (skip - already exists)');
        successCount++;
      } else {
        console.log(`❌ ${result.error.substring(0, 100)}`);
        errorCount++;
        errors.push({ file, error: result.error });
      }
    }
    
    // Delay nhỏ để tránh rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Success: ${successCount}/${files.length}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Error details:');
    for (const e of errors) {
      console.log(`  - ${e.file}: ${e.error.substring(0, 150)}`);
    }
  }
  
  console.log('\n✅ Schema migration complete!');
  console.log('📌 Next: Tạo user đầu tiên trong Supabase Dashboard → Authentication → Users');
}

main().catch(console.error);
