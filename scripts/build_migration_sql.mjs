/**
 * Script tạo combined SQL để chạy trên project mới
 * Usage: node scripts/build_migration_sql.mjs
 * 
 * Output: backups/combined_schema.sql
 * Sau đó paste vào Supabase Dashboard → SQL Editor của project mới
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQL_DIR = path.join(__dirname, '..', 'sql');
const OUTPUT_FILE = path.join(__dirname, '..', 'backups', 'combined_schema.sql');

// Các file SQL schema chạy theo thứ tự (bỏ qua debug/check/backfill data cụ thể)
// Chỉ lấy migrations có prefix ngày tháng
function getSortedMigrationFiles() {
  const files = fs.readdirSync(SQL_DIR)
    .filter(f => f.match(/^\d{4}-\d{2}-\d{2}_/) && f.endsWith('.sql'))
    .sort(); // sort alphabetically = sort by date
  
  return files;
}

function main() {
  const files = getSortedMigrationFiles();
  
  console.log(`📋 Found ${files.length} migration files`);
  
  let combined = `-- ============================================================
-- COMBINED MIGRATION SQL - MotoCare
-- Generated: ${new Date().toISOString()}
-- Run this in: Supabase Dashboard → SQL Editor (project mới)
-- ============================================================

-- Enable required extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

`;

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(SQL_DIR, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      combined += `\n-- ============================================================\n`;
      combined += `-- FILE: ${file}\n`;
      combined += `-- ============================================================\n`;
      combined += content;
      combined += '\n\n';
      
      console.log(`  ✅ ${file}`);
      successCount++;
    } catch (err) {
      console.log(`  ❌ ${file}: ${err.message}`);
      errorCount++;
    }
  }

  // Đảm bảo thư mục backups tồn tại
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, combined, 'utf8');
  
  const sizeKB = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
  
  console.log(`\n✅ Done! ${successCount} files combined`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Output: backups/combined_schema.sql`);
  console.log(`📊 Size: ${sizeKB} KB`);
  console.log(`\n📌 NEXT STEP:`);
  console.log(`   1. Mở file: backups/combined_schema.sql`);
  console.log(`   2. Vào Supabase Dashboard → project mới → SQL Editor`);
  console.log(`   3. Paste nội dung và Run`);
}

main();
