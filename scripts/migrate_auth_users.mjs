/**
 * Migrate Auth Users từ project cũ sang project mới
 * 
 * Lưu ý: Password hash KHÔNG thể copy được vì lý do bảo mật.
 * Users sẽ cần dùng "Quên mật khẩu" hoặc được set mật khẩu tạm thời.
 * 
 * Usage: node scripts/migrate_auth_users.mjs YOUR_TOKEN
 */

import fs from 'fs';

const OLD_PROJECT_REF = 'uluxycppxlzdskyklgqt';
const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const TOKEN = process.argv[2];
// Service role key của project CŨ (để đọc users)
const OLD_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdXh5Y3BweGx6ZHNreWtsZ3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUwNTkzMiwiZXhwIjoyMDc4MDgxOTMyfQ.dJ--iUVVw5rPbn9fjErGV-681fwUOnfz8Ut7OluO8Ws';

if (!TOKEN) {
  console.error('Usage: node scripts/migrate_auth_users.mjs YOUR_TOKEN');
  process.exit(1);
}

const MGMT_HEADERS = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

// Lấy tất cả users từ project cũ qua Auth Admin API
async function fetchAllUsers() {
  let allUsers = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const res = await fetch(
      `https://${OLD_PROJECT_REF}.supabase.co/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${OLD_SERVICE_ROLE_KEY}`,
          'apikey': OLD_SERVICE_ROLE_KEY,
        }
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to fetch users: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const users = data.users || [];
    allUsers = allUsers.concat(users);

    console.log(`  Page ${page}: ${users.length} users`);

    if (users.length < perPage) break;
    page++;
  }

  return allUsers;
}

// Tạo user trong project mới qua Auth Admin API
async function createUser(user) {
  const payload = {
    email: user.email,
    email_confirm: true,        // Bỏ qua bước verify email
    user_metadata: user.user_metadata || {},
    app_metadata: user.app_metadata || {},
    // Password tạm - user sẽ cần reset
    password: 'MotoCare@2026!',
  };

  const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocG5xb3lsanRmd3FxbG9taXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg3MzU0MiwiZXhwIjoyMTAxNDQ5NTQyfQ.AnR7plvRxTrNp2_ziyDnDRFwoAquQSEXIbyKs_SEGvE';

  const res = await fetch(
    `https://${NEW_PROJECT_REF}.supabase.co/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEW_SERVICE_ROLE_KEY}`,
        'apikey': NEW_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.message || JSON.stringify(data), newId: null };
  }
  return { ok: true, newId: data.id, oldId: user.id };
}

async function main() {
  console.log('👥 Migrating Auth Users');
  console.log('=======================');
  console.log(`FROM: ${OLD_PROJECT_REF}`);
  console.log(`TO:   ${NEW_PROJECT_REF}`);
  console.log('');

  // Bước 1: Lấy users từ project cũ
  console.log('📥 Fetching users from old project...');
  let oldUsers;
  try {
    oldUsers = await fetchAllUsers();
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
  console.log(`✅ Found ${oldUsers.length} users\n`);

  // In ra danh sách để review
  console.log('📋 Users to migrate:');
  for (const u of oldUsers) {
    console.log(`  - ${u.email} (${u.id}) | created: ${u.created_at}`);
  }
  console.log('');

  // Save danh sách để reference sau
  fs.writeFileSync(
    'backups/old_users_export.json',
    JSON.stringify(oldUsers, null, 2),
    'utf8'
  );
  console.log('💾 Saved to backups/old_users_export.json\n');

  // Bước 2: Tạo users trong project mới
  console.log('📤 Creating users in new project...');
  const idMapping = {}; // oldId -> newId mapping
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of oldUsers) {
    process.stdout.write(`  ${user.email}... `);

    const result = await createUser(user);
    if (result.ok) {
      console.log(`✅ new id: ${result.newId}`);
      idMapping[user.id] = result.newId;
      success++;
    } else {
      console.log(`❌ ${result.error?.substring(0, 100)}`);
      idMapping[user.id] = null;
      failed++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // Save ID mapping
  fs.writeFileSync(
    'backups/user_id_mapping.json',
    JSON.stringify(idMapping, null, 2),
    'utf8'
  );

  console.log(`\n\n📊 SUMMARY`);
  console.log(`==========`);
  console.log(`✅ Created: ${success}`);
  console.log(`⚠️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n💾 ID mapping saved to: backups/user_id_mapping.json`);

  if (Object.keys(idMapping).length > 0) {
    const sameId = Object.entries(idMapping).filter(([old, nw]) => old === nw).length;
    const diffId = Object.entries(idMapping).filter(([old, nw]) => old !== nw && nw).length;

    console.log(`\n⚠️  QUAN TRỌNG:`);
    if (diffId > 0) {
      console.log(`  ${diffId} users có ID mới khác ID cũ.`);
      console.log(`  Cần migrate profiles table với ID mapping này.`);
    }
    console.log(`  Tất cả users được set mật khẩu tạm: MotoCare@2026!`);
    console.log(`  Sau khi đăng nhập lần đầu, yêu cầu đổi mật khẩu.`);
  }
}

main().catch(console.error);
