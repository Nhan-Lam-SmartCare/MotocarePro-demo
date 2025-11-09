import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uluxycppxlzdskyklgqt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsdXh5Y3BweGx6ZHNreWtsZ3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDU5MzIsImV4cCI6MjA3ODA4MTkzMn0.pCmr1LEfsiPnvWKeTjGX4zGgUOYbwaLoKe1Qzy5jbdk";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
  { email: "owner.motocare.test@gmail.com", role: "owner" },
  { email: "manager.motocare.test@gmail.com", role: "manager" },
  { email: "staff.motocare.test@gmail.com", role: "staff" },
];

async function ensureUser(email, password) {
  const r1 = await supabase.auth.signUp({ email, password });
  if (r1.error && r1.error.code !== "user_already_exists") {
    console.log("signUp error for", email, r1.error);
  } else {
    console.log(
      "signUp ok/existing for",
      email,
      r1.data?.user?.id || "existing"
    );
  }
}

async function main() {
  for (const u of users) {
    await ensureUser(u.email, "Motocare@2025!");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
