import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY // Use service key for admin operations
);

console.log("Applying SQL fix...");

const sql = readFileSync(
  "sql/2025-11-12_fix_sale_create_atomic_columns.sql",
  "utf8"
);

const { data, error } = await supabase.rpc("exec_sql", { sql_string: sql });

if (error) {
  console.error("Error applying SQL:", error);
} else {
  console.log("✅ SQL applied successfully");
}
