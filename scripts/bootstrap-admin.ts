/**
 * Bootstrap script: Creates the first admin user + employee record.
 * Run once with: npx tsx scripts/bootstrap-admin.ts
 */

import { createClient } from "@supabase/supabase-js";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read .env.local manually (no dotenv dependency)
function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    console.error(`Could not read ${filePath}`);
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "admin@company.com";
const ADMIN_PASSWORD = "Admin123!";

async function main() {
  console.log("🔧 Bootstrapping admin user...\n");

  // 1. Check if admin already exists
  const { data: existing } = await admin
    .from("employees")
    .select("id, work_email")
    .eq("work_email", ADMIN_EMAIL)
    .maybeSingle();

  if (existing) {
    console.log(`⚠️  Employee with email ${ADMIN_EMAIL} already exists. Skipping.`);
    process.exit(0);
  }

  // 2. Get a department for the admin
  const { data: dept } = await admin.from("departments").select("id, name").limit(1).single();

  if (!dept) {
    console.error("❌ No departments found. Run seed.sql first.");
    process.exit(1);
  }

  // 3. Create Auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    console.error("❌ Failed to create Auth user:", authError.message);
    process.exit(1);
  }

  console.log(`✅ Auth user created: ${authData.user.id}`);

  // 4. Create employee record
  const { data: employee, error: empError } = await admin
    .from("employees")
    .insert({
      auth_user_id: authData.user.id,
      employee_code: "ADM001",
      full_name: "System Administrator",
      work_email: ADMIN_EMAIL,
      department_id: dept.id,
      position: "System Administrator",
      join_date: new Date().toISOString().split("T")[0],
      role: "ADMIN",
      status: "ACTIVE",
      must_change_password: false,
    })
    .select("id")
    .single();

  if (empError) {
    console.error("❌ Failed to create employee:", empError.message);
    await admin.auth.admin.deleteUser(authData.user.id);
    process.exit(1);
  }

  console.log(`✅ Employee created: ${employee.id}`);

  // 5. Initialize leave balances
  const { data: leaveTypes } = await admin
    .from("leave_types")
    .select("id, default_entitlement")
    .eq("is_active", true)
    .eq("deducts_balance", true);

  if (leaveTypes && leaveTypes.length > 0) {
    const year = new Date().getFullYear();
    await admin.from("leave_balances").insert(
      leaveTypes.map((lt) => ({
        employee_id: employee.id,
        leave_type_id: lt.id,
        balance_year: year,
        entitled_days: lt.default_entitlement,
      })),
    );
    console.log(`✅ Leave balances initialized (${leaveTypes.length} types)`);
  }

  console.log("\n========================================");
  console.log("  🎉 Admin user bootstrapped!");
  console.log("========================================");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("========================================");
  console.log("\nRun `npm run dev` and sign in with these credentials.\n");
}

main().catch(console.error);
