
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser(email) {
    console.log(`🔍 Checking user status for: ${email}`);

    // 1. Check Allowlist
    const { data: allowlist, error: allowError } = await supabase
        .from('app_allowlist')
        .select('*')
        .eq('email', email);

    if (allowError) {
        console.error("❌ Error checking allowlist:", allowError.message);
    } else if (allowlist.length === 0) {
        console.log("❌ Email NOT in Allowlist (app_allowlist).");
    } else {
        console.log("✅ Email FOUND in Allowlist:", allowlist[0]);
    }

    // 2. Check App Users
    const { data: users, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email);

    if (userError) {
        console.error("❌ Error checking users:", userError.message);
    } else if (users.length === 0) {
        console.log("❌ Email NOT registered as User (app_users).");
    } else {
        console.log("✅ Email FOUND in Users:", users[0]);
    }

    // 3. Check Auth Tokens
    const { data: tokens, error: tokenError } = await supabase
        .from('auth_tokens')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false });

    if (tokens && tokens.length > 0) {
        console.log(`ℹ️ Found ${tokens.length} tokens for this email.`);
        console.log("Last token:", tokens[0]);
    } else {
        console.log("ℹ️ No tokens found for this email.");
    }
}

checkUser('jaderdata@gmail.com');
