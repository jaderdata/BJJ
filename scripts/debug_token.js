
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkToken() {
    const token = '5d88fd318cd740e9d31c803be6bb43d01da0cf557c172323f9eefc5adf1b21c5';
    console.log(`🔍 Checking Token: ${token}`);

    const { data: tokens, error } = await supabase
        .from('auth_tokens')
        .select('*')
        .eq('token', token);

    if (error) {
        console.error("❌ SQL Error checking token:", error.message);
        return;
    }

    if (!tokens || tokens.length === 0) {
        console.error("❌ Token NOT FOUND in database.");
        return;
    }

    const t = tokens[0];
    console.log("✅ Token Found:");
    console.log(`   Type: ${t.type}`);
    console.log(`   Used: ${t.used}`);
    console.log(`   Expires: ${t.expires_at}`);

    // Check expiration
    const now = new Date();
    const expires = new Date(t.expires_at);
    if (expires < now) {
        console.error("❌ Token EXPIRED.");
    } else {
        console.log("✅ Token Active (Time valid).");
    }

    if (t.used) {
        console.error("❌ Token ALREADY USED.");
    }
}

checkToken();
