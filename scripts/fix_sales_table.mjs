import fs from 'fs';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const TOKEN = process.argv[2];

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
  const sql = `
    ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sale_code TEXT;
    ALTER TABLE public.sales ALTER COLUMN userid DROP NOT NULL;
    DROP TRIGGER IF EXISTS trigger_set_sale_code ON public.sales;
  `;
  await runQuery(sql);
  console.log('✅ sales table altered: sale_code column added, userid NOT NULL dropped, trigger dropped.');
}

main().catch(console.error);
