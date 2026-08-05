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
    CREATE OR REPLACE FUNCTION notify_new_sale()
    RETURNS TRIGGER AS $$
    DECLARE
      item_count INTEGER;
    BEGIN
      item_count := COALESCE(jsonb_array_length(NEW.items), 0);
      
      PERFORM create_notification(
        'sale',
        '🛒 Bán hàng mới',
        FORMAT('Đơn %s - %s (%s sản phẩm)', 
          COALESCE(NEW.sale_code, 'N/A'),
          TO_CHAR(COALESCE(NEW.total, 0), 'FM999,999,999') || 'đ',
          item_count
        ),
        jsonb_build_object(
          'sale_id', NEW.id,
          'code', NEW.sale_code,
          'total', NEW.total,
          'item_count', item_count,
          'payment_method', NEW.paymentmethod,
          'customer_name', NEW.customer->>'name'
        ),
        'owner',
        NEW.branchid,
        NULL
      );
      
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  await runQuery(sql);
  console.log('✅ notify_new_sale trigger function updated to use lowercase column names and exception catch.');
}

main().catch(console.error);
