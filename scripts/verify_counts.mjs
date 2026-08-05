const TOKEN = 'sbp_1e2fc42afbf1dad9eff12f2566a8be2c2cbef1ad';
const NEW_REF = 'nhpnqoyljtfwqqlomiyz';

async function main() {
  const sql = `
    SELECT 'work_orders' as table_name, count(*) FROM public.work_orders
    UNION ALL SELECT 'sales', count(*) FROM public.sales
    UNION ALL SELECT 'customers', count(*) FROM public.customers
    UNION ALL SELECT 'parts', count(*) FROM public.parts
    UNION ALL SELECT 'cash_transactions', count(*) FROM public.cash_transactions
    UNION ALL SELECT 'inventory_transactions', count(*) FROM public.inventory_transactions
    UNION ALL SELECT 'customer_debts', count(*) FROM public.customer_debts
    UNION ALL SELECT 'suppliers', count(*) FROM public.suppliers;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${NEW_REF}/database/query`, {
    method: 'POST',
    headers: {'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({query: sql})
  });
  const data = await res.json();
  console.log('📊 IMPORTED DATA SUMMARY:');
  console.table(data);
}

main().catch(console.error);
