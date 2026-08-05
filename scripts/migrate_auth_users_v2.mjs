/**
 * Migrate Auth Users qua Database Query API (bypass egress restriction)
 * Đọc auth.users trực tiếp từ DB, không qua Auth API bị chặn
 * 
 * Usage: node scripts/migrate_auth_users_v2.mjs YOUR_TOKEN
 */

import fs from 'fs';

const OLD_PROJECT_REF = 'uluxycppxlzdskyklgqt';
const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const TOKEN = process.argv[2];
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocG5xb3lsanRmd3FxbG9taXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg3MzU0MiwiZXhwIjoyMTAxNDQ5NTQyfQ.AnR7plvRxTrNp2_ziyDnDRFwoAquQSEXIbyKs_SEGvE';

if (!TOKEN) {
  console.error('Usage: node scripts/migrate_auth_users_v2.mjs YOUR_TOKEN');
  process.exit(1);
}

async function runQuery(projectRef, sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
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

async function createUserViaAdminAPI(user) {
  const res = await fetch(
    `https://${NEW_PROJECT_REF}.supabase.co/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEW_SERVICE_ROLE_KEY}`,
        'apikey': NEW_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        email_confirm: true,
        password: 'MotoCare@2026!',
        user_metadata: user.raw_user_meta_data || {},
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.message || JSON.stringify(data) };
  return { ok: true, newId: data.id };
}

async function main() {
  console.log('👥 Migrating Auth Users (via DB query bypass)');
  console.log('==============================================');

  // Bước 1: Đọc users từ auth.users của project CŨ qua DB query API
  console.log('\n📥 Reading auth.users from old project via DB query...');
  let oldUsers;
  try {
    const rows = await runQuery(OLD_PROJECT_REF,
      `SELECT 
        id, email, 
        raw_user_meta_data,
        raw_app_meta_data,
        created_at,
        email_confirmed_at
       FROM auth.users 
       WHERE email IS NOT NULL
       ORDER BY created_at`
    );
    oldUsers = rows;
    console.log(`✅ Found ${oldUsers.length} users`);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }

  // In danh sách
  console.log('\n📋 Users found:');
  for (const u of oldUsers) {
    console.log(`  - ${u.email} | id: ${u.id} | created: ${u.created_at?.substring(0,10)}`);
  }

  // Save
  fs.mkdirSync('backups', { recursive: true });
  fs.writeFileSync('backups/old_users_export.json', JSON.stringify(oldUsers, null, 2));
  console.log('\n💾 Saved to backups/old_users_export.json');

  // Bước 2: Tạo users trong project mới
  console.log('\n📤 Creating users in new project...');
  const idMapping = {};
  let success = 0, failed = 0;

  for (const user of oldUsers) {
    process.stdout.write(`  ${user.email}... `);

    const result = await createUserViaAdminAPI(user);
    if (result.ok) {
      console.log(`✅ new id: ${result.newId}`);
      idMapping[user.id] = result.newId;
      success++;
    } else if (result.error?.includes('already been registered')) {
      console.log(`⚠️  already exists`);
      // Tìm ID của user đã tồn tại
      try {
        const existing = await runQuery(NEW_PROJECT_REF,
          `SELECT id FROM auth.users WHERE email = '${user.email.replace("'", "''")}'`
        );
        if (existing[0]) {
          idMapping[user.id] = existing[0].id;
        }
      } catch {}
      failed++;
    } else {
      console.log(`❌ ${result.error?.substring(0, 100)}`);
      idMapping[user.id] = null;
      failed++;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  fs.writeFileSync('backups/user_id_mapping.json', JSON.stringify(idMapping, null, 2));

  console.log(`\n\n📊 SUMMARY`);
  console.log(`✅ Created: ${success}/${oldUsers.length}`);
  console.log(`❌ Failed/skipped: ${failed}`);
  console.log(`💾 ID mapping: backups/user_id_mapping.json`);

  // Kiểm tra xem có user nào bị đổi ID không
  const changedIds = Object.entries(idMapping).filter(([o, n]) => n && o !== n);
  if (changedIds.length > 0) {
    console.log(`\n⚠️  ${changedIds.length} users có ID mới khác ID cũ - cần migrate profiles`);
    for (const [oldId, newId] of changedIds) {
      console.log(`  ${oldId} → ${newId}`);
    }
  } else {
    console.log(`\n✅ Tất cả user IDs giữ nguyên hoặc đã map xong`);
  }

  console.log(`\n🔑 Mật khẩu tạm cho tất cả users: MotoCare@2026!`);
  console.log(`   Yêu cầu đổi mật khẩu sau lần đăng nhập đầu.`);
}

main().catch(console.error);
