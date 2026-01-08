
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log("🕵️ Starting Diagnosis: Invite Flow...\n");

    // Test Email
    const testEmail = `diagnose.${Date.now()}@test.com`;
    console.log(`target email: ${testEmail}`);

    // 1. Add to Allowlist (Simulate Admin Action)
    console.log("\n1. [ADMIN] Adding to Allowlist...");
    const { data: allow, error: allowError } = await supabase
        .from('app_allowlist')
        .insert({ email: testEmail, role: 'SALES', status: 'ACTIVE' })
        .select()
        .single();

    if (allowError) {
        console.error("❌ Failed to add to allowlist:", allowError.message);
        console.error("   HINT: RLS policies might be blocking insert.");
        return;
    }
    console.log("✅ Added to allowlist:", allow.id);

    // 2. Request Access (Simulate User Action)
    console.log("\n2. [USER] Requesting Access...");
    const { data: rpcData, error: rpcError } = await supabase.rpc('auth_request_access', {
        p_email: testEmail
    });

    if (rpcError) {
        console.error("❌ RPC Call Failed:", rpcError.message);
        return;
    }
    console.log("   Result:", rpcData);

    // 3. Verify Token Generation
    console.log("\n3. [SYSTEM] Checking 'auth_tokens' table...");
    const { data: tokens, error: tokenError } = await supabase
        .from('auth_tokens')
        .select('*')
        .eq('email', testEmail)
        .order('created_at', { ascending: false });

    if (tokenError) console.error("❌ Error checking tokens:", tokenError.message);
    else if (!tokens || tokens.length === 0) console.error("❌ NO TOKEN FOUND. RPC did not generate token.");
    else {
        console.log("✅ Token found:", tokens[0].token.substring(0, 10) + "...");
        console.log("   Expires:", tokens[0].expires_at);
    }

    // 4. Verify Log Generation
    console.log("\n4. [SYSTEM] Checking 'auth_logs' table (Simulated Email)...");
    const { data: logs, error: logError } = await supabase
        .from('auth_logs')
        .select('*')
        .eq('email', testEmail)
        .like('action', 'EMAIL_SENT%')
        .order('created_at', { ascending: false });

    if (logError) console.error("❌ Error checking logs:", logError.message);
    else if (!logs || logs.length === 0) console.error("❌ NO LOG FOUND. RPC did not create log entry.");
    else {
        console.log("✅ Log found:", logs[0].action);
        console.log("   Details (LINK IS HERE):", logs[0].details);
    }

    console.log("\n🏁 Diagnosis Complete.");
}

diagnose();
