
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyConstraint() {
    console.log("🛡️ Applying Unique Constraint...");

    // 0. Authenticate
    const email = 'verifier.admin@bjjvisits.com';
    const password = 'StrongVerifierPassword123!';
    await supabase.auth.signInWithPassword({ email, password });

    // 1. Raw SQL Execution (Simulated via RPC if available, or just standard query if permissions allow)
    // Since we don't have a direct "exec_sql" RPC exposed to anon/authenticated usually, 
    // and I cannot use the MCP tool, I will try to use a wrapper if one exists, 
    // OR primarily, restart the `recover_lost_visits` approach which implies we might need the user to run this SQL manually
    // IF I cannot run DDL via the client.

    // However, looking at previous context, `scripts/restore_system_structure.sql` was used.
    // I will try to use the `rpc` method if a `exec_sql` function exists (common in some setups),
    // otherwise I will output the instruction for the user to run it in Supabase Dashboard.

    const { error } = await supabase.rpc('exec_sql', {
        query: `ALTER TABLE visits ADD CONSTRAINT unique_visit_event_academy UNIQUE (event_id, academy_id);`
    });

    if (error) {
        console.error("❌ Failed to apply constraint via RPC (Expected if RPC not set up):", error.message);
        console.log("⚠️ PLEASE RUN 'scripts/add_unique_constraint.sql' MANUALLY IN SUPABASE SQL EDITOR.");
    } else {
        console.log("✅ Constraint applied successfully via RPC!");
    }
}

applyConstraint();
