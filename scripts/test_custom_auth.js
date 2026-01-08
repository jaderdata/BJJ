
import { createClient } from '@supabase/supabase-js';

// Config
const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
    console.log("🔐 Testing Custom Auth System...\n");

    const testEmail = `test.auth.${Date.now()}@example.com`;
    const adminEmail = 'jader_dourado@hotmail.com';

    // 1. Try to Login with Wrong Credentials
    console.log("1. Testing Login (Should Fail)...");
    const { data: loginFail } = await supabase.rpc('auth_login', {
        p_email: testEmail,
        p_password: 'wrong'
    });
    console.log("   Result:", loginFail);

    // 2. Try to Login with Admin (Should Succeed if seeded)
    console.log("\n2. Testing Admin Login (Should Succeed if SQL ran)...");
    const { data: adminLogin, error: adminError } = await supabase.rpc('auth_login', {
        p_email: adminEmail,
        p_password: '123456' // Default from seed
    });

    if (adminError) {
        console.error("   ❌ Error calling RPC. Did you run the SQL script?");
        console.error("   Details:", adminError.message);
        return;
    }
    console.log("   Result:", adminLogin);

    // 3. Request Access (Should be ignored as email is not in allowlist)
    console.log(`\n3. Testing Request Access for ${testEmail} (Should be silent success)...`);
    const { data: reqAccess } = await supabase.rpc('auth_request_access', {
        p_email: testEmail
    });
    console.log("   Result:", reqAccess);

    console.log("\n🏁 Test Complete.");
}

testAuth();
