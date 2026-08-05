/**
 * Create missing base tables: branches, store_settings, promotions, fixed_assets, capital
 * Usage: node scripts/setup_missing_base_tables.mjs sbp_1e2fc42afbf1dad9eff12f2566a8be2c2cbef1ad
 */

import fs from 'fs';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.error('Usage: node scripts/setup_missing_base_tables.mjs YOUR_TOKEN');
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

async function main() {
  console.log('🛠️ Setting up missing base tables in new project...');

  const sql = `
    -- 1. BRANCHES TABLE
    CREATE TABLE IF NOT EXISTS public.branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO public.branches (id, name, address, phone)
    VALUES ('CN1', 'Chi nhánh 1 - Phú Lợi B', 'Phú Lợi B, Xã Long Phú Thuận, Đồng Tháp', '0947-747-907')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone;

    ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all read branches" ON public.branches;
    CREATE POLICY "Allow all read branches" ON public.branches FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow all write branches" ON public.branches;
    CREATE POLICY "Allow all write branches" ON public.branches FOR ALL USING (true);

    -- 2. STORE_SETTINGS TABLE
    CREATE TABLE IF NOT EXISTS public.store_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_name TEXT NOT NULL DEFAULT 'Nhạn Lâm SmartCare',
      store_name_en TEXT,
      slogan TEXT DEFAULT 'Chăm sóc xe máy chuyên nghiệp',
      address TEXT DEFAULT 'Phú Lợi B, Xã Long Phú Thuận, Đồng Tháp',
      phone TEXT DEFAULT '0947-747-907',
      email TEXT DEFAULT 'ltnsmart2022@gmail.com',
      website TEXT,
      tax_code TEXT,
      logo_url TEXT,
      bank_qr_url TEXT,
      primary_color TEXT DEFAULT '#3B82F6',
      theme_preset TEXT DEFAULT 'blue',
      business_hours TEXT DEFAULT '8:00 - 18:00 (T2-CN)',
      established_year INTEGER,
      bank_name TEXT DEFAULT 'LPBank',
      bank_account_number TEXT DEFAULT '0944619393',
      bank_account_holder TEXT DEFAULT 'VO THANH LAM',
      bank_branch TEXT DEFAULT 'Chi nhánh Đồng Tháp',
      invoice_prefix TEXT DEFAULT 'HD',
      receipt_prefix TEXT DEFAULT 'PN',
      work_order_prefix TEXT DEFAULT 'SC',
      sale_prefix TEXT DEFAULT 'BH',
      invoice_footer_note TEXT DEFAULT 'Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ!',
      currency TEXT DEFAULT 'VND',
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
      retail_markup_percent NUMERIC DEFAULT 40,
      wholesale_markup_percent NUMERIC DEFAULT 25,
      print_paper_size TEXT DEFAULT 'K80',
      print_show_logo BOOLEAN DEFAULT true,
      print_greeting TEXT DEFAULT 'Cảm ơn quý khách! Hẹn gặp lại',
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow read store_settings" ON public.store_settings;
    CREATE POLICY "Allow read store_settings" ON public.store_settings FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Allow update store_settings" ON public.store_settings;
    CREATE POLICY "Allow update store_settings" ON public.store_settings FOR ALL USING (true);

    -- Seed store_settings if empty
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.store_settings LIMIT 1) THEN
        INSERT INTO public.store_settings (
          store_name, address, phone, email, bank_name, bank_account_number, bank_account_holder, bank_branch, work_order_prefix
        ) VALUES (
          'Nhạn Lâm SmartCare',
          'Phú Lợi B, Xã Long Phú Thuận, Đồng Tháp',
          '0947-747-907',
          'ltnsmart2022@gmail.com',
          'LPBank',
          '0944619393',
          'VO THANH LAM',
          'Chi nhánh Đồng Tháp',
          'SC'
        );
      END IF;
    END $$;

    -- Grants
    GRANT ALL ON public.branches TO authenticated, anon, service_role;
    GRANT ALL ON public.store_settings TO authenticated, anon, service_role;
  `;

  try {
    await runQuery(sql);
    console.log('✅ Base tables (branches, store_settings) set up successfully!');
  } catch (err) {
    console.error('❌ Error setting up base tables:', err.message);
  }
}

main().catch(console.error);
