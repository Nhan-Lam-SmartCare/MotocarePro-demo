/**
 * Recreate exact Auth Users & Profiles in New Project with exact UUIDs
 * Usage: node scripts/recreate_users_in_new_project.mjs sbp_1e2fc42afbf1dad9eff12f2566a8be2c2cbef1ad
 */

import fs from 'fs';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error('Usage: node scripts/recreate_users_in_new_project.mjs YOUR_TOKEN');
  process.exit(1);
}

const usersToCreate = [
  {
    id: 'cbec6e23-15ac-4191-b51f-0ede27bb13a9',
    email: 'nhanxn@gmail.com',
    full_name: 'Nguyễn Xuân Nhạn',
    role: 'owner',
    branch_id: 'CN1'
  },
  {
    id: '30f06993-1bbb-4d68-b3e0-a76347bedee3',
    email: 'truongcuongya123@gmail.com',
    full_name: 'Trương văn Cuông',
    role: 'staff',
    branch_id: 'CN1'
  },
  {
    id: '6769f9c6-d8de-497f-8ea2-c7124d846ae7',
    email: 'lam.tcag@gmail.com',
    full_name: 'Võ Thanh Lâm',
    role: 'owner',
    branch_id: 'CN1'
  },
  {
    id: 'cc81ee52-c161-44e5-bb53-d9787e5a659c',
    email: 'owner@motocare.vn',
    full_name: 'MotoCare Owner',
    role: 'owner',
    branch_id: 'CN1'
  },
  {
    id: 'adc3f1f5-3631-4268-ae43-d62b7e8f1169',
    email: 'demo@gmail.com',
    full_name: 'Demo Account',
    role: 'staff',
    branch_id: 'CN1'
  },
  {
    id: '77001416-c03d-4be5-ae62-dfdb740c1463',
    email: 'piihuynh134@gmail.com',
    full_name: 'Pii Huỳnh',
    role: 'manager',
    branch_id: 'CN1'
  }
];

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

async function main() {
  console.log('👥 Recreating Auth Users & Profiles in New Project (Preserving IDs)');
  console.log('=====================================================================');

  // Step 1: Ensure profiles and user_profiles tables exist
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      name TEXT,
      full_name TEXT,
      role TEXT,
      branch_id TEXT,
      status TEXT DEFAULT 'active',
      "allowedApps" JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
      full_name TEXT,
      phone TEXT,
      avatar_url TEXT,
      branch_id TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
    CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Public read user_profiles" ON public.user_profiles;
    CREATE POLICY "Public read user_profiles" ON public.user_profiles FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow all for authenticated profiles" ON public.profiles;
    CREATE POLICY "Allow all for authenticated profiles" ON public.profiles FOR ALL USING (true);
    DROP POLICY IF EXISTS "Allow all for authenticated user_profiles" ON public.user_profiles;
    CREATE POLICY "Allow all for authenticated user_profiles" ON public.user_profiles FOR ALL USING (true);
  `;

  console.log('📌 Creating profiles and user_profiles tables...');
  await runQuery(createTablesSql);
  console.log('✅ Tables created.');

  const defaultPassword = 'MotoCare@2026!';

  for (const u of usersToCreate) {
    console.log(`\n⏳ Processing ${u.email} (${u.id})...`);

    const sql = `
      -- Insert or update auth.users with exact ID and encrypted password
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        '${u.id}'::uuid,
        'authenticated',
        'authenticated',
        '${u.email}',
        crypt('${defaultPassword}', gen_salt('bf')),
        NOW(),
        NULL,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', '${u.full_name || ''}'),
        FALSE,
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        email_confirmed_at = NOW();

      -- Insert into public.profiles
      INSERT INTO public.profiles (
        id,
        email,
        name,
        full_name,
        role,
        branch_id,
        status,
        created_at,
        updated_at
      )
      VALUES (
        '${u.id}'::uuid,
        '${u.email}',
        '${u.full_name}',
        '${u.full_name}',
        '${u.role}',
        '${u.branch_id}',
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        updated_at = NOW();

      -- Insert into public.user_profiles
      INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        role,
        branch_id,
        created_at,
        updated_at
      )
      VALUES (
        '${u.id}'::uuid,
        '${u.email}',
        '${u.full_name}',
        '${u.role}',
        '${u.branch_id}',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id,
        updated_at = NOW();
    `;

    try {
      await runQuery(sql);
      console.log(`  ✅ Successfully created user & profiles for ${u.email}`);
    } catch (err) {
      console.error(`  ❌ Error processing ${u.email}:`, err.message);
    }
  }

  console.log('\n\n🎉 ALL USERS CREATED SUCCESSFULLY!');
  console.log('====================================');
  console.log('Mật khẩu tạm thời cho tất cả các tài khoản là: MotoCare@2026!');
  console.log('\nDanh sách tài khoản đã khôi phục:');
  usersToCreate.forEach(u => {
    console.log(` - ${u.email} (${u.full_name || 'N/A'}) - Vai trò: ${u.role}`);
  });
}

main().catch(console.error);
