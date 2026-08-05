import fs from 'fs';
import path from 'path';

const NEW_PROJECT_REF = 'nhpnqoyljtfwqqlomiyz';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocG5xb3lsanRmd3FxbG9taXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTg3MzU0MiwiZXhwIjoyMTAxNDQ5NTQyfQ.AnR7plvRxTrNp2_ziyDnDRFwoAquQSEXIbyKs_SEGvE';
const BACKUP_DIR = 'g:\\Motocare\\backups\\backup_2026-08-04T10-00-03-547Z';

async function importSalesViaREST() {
  const filePath = path.join(BACKUP_DIR, 'sales.json');
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`📥 Importing ${rows.length} sales rows via PostgREST API...`);

  // Normalize column names for PostgREST (PostgREST table columns in DB: userid, branchid, cashtransactionid, paymentmethod, etc.)
  // Target DB columns for sales:
  // id, date, items, subtotal, discount, total, customer, paymentmethod, userid, costprice, vatrate, branchid, cashtransactionid, created_at, refunded, refundreason, delivery_*, note, sale_code
  const validCols = new Set([
    'id', 'date', 'items', 'subtotal', 'discount', 'total', 'customer', 'paymentmethod',
    'userid', 'costprice', 'vatrate', 'branchid', 'cashtransactionid', 'created_at',
    'refunded', 'refundreason', 'delivery_method', 'delivery_status', 'delivery_address',
    'delivery_phone', 'delivery_note', 'shipper_id', 'cod_amount', 'shipping_fee',
    'estimated_delivery_date', 'actual_delivery_date', 'tracking_number', 'note', 'sale_code'
  ]);

  const preparedRows = rows.map(r => {
    const rowObj = {};
    for (const [k, v] of Object.entries(r)) {
      const lower = k.toLowerCase();
      if (validCols.has(lower)) {
        if (rowObj[lower] === undefined || rowObj[lower] === null) {
          rowObj[lower] = v;
        }
      }
    }
    return rowObj;
  });

  const BATCH_SIZE = 100;
  let imported = 0;

  for (let i = 0; i < preparedRows.length; i += BATCH_SIZE) {
    const batch = preparedRows.slice(i, i + BATCH_SIZE);

    const res = await fetch(`https://${NEW_PROJECT_REF}.supabase.co/rest/v1/sales`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal, resolution=ignore-duplicates'
      },
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ Batch ${i / BATCH_SIZE + 1} error:`, err);
    } else {
      imported += batch.length;
      console.log(`  ✅ Batch ${i / BATCH_SIZE + 1} (${batch.length} rows) imported.`);
    }
  }

  console.log(`\n🎉 Total sales imported: ${imported}/${rows.length}`);
}

importSalesViaREST().catch(console.error);
