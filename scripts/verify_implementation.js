import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyImplementation() {
    console.log("🔍 Starting Implementation Verification...");

    // 1. Authenticate
    const email = 'verifier.admin@bjjvisits.com';
    const password = 'StrongVerifierPassword123!';

    let { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        if (authError.message.includes("Invalid login")) {
            // Try sign up if login fails (first run)
            console.log("User not found, attempting signup...");
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password
            });
            if (signUpError) {
                console.error("❌ Auth failed:", signUpError.message);
                return;
            }
            user = signUpData.user;
        } else {
            console.error("❌ Auth failed:", authError.message);
            return;
        }
    }

    if (!user) {
        console.error("❌ No user returned.");
        return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);

    // 2. Test Notifications Table
    console.log("\nTesting 'notifications' table...");
    try {
        const { data: notif, error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: user.id,
                message: 'Test Notification ' + Date.now(),
                read: false
            })
            .select()
            .single();

        if (notifError) {
            if (notifError.code === '42P01') {
                console.error("❌ Table 'notifications' DOES NOT EXIST.");
            } else {
                console.error("❌ Failed to insert notification:", notifError.message);
            }
        } else {
            console.log("✅ Notification inserted successfully:", notif.id);

            // Cleanup
            await supabase.from('notifications').delete().eq('id', notif.id);
            console.log("✅ Notification cleanup (delete) successful.");
        }
    } catch (e) {
        console.error("❌ Exception testing notifications:", e);
    }

    // 3. Test System Logs Table
    console.log("\nTesting 'system_logs' table...");
    try {
        const { data: log, error: logError } = await supabase
            .from('system_logs')
            .insert({
                user_id: user.id,
                user_name: 'Verifier Bot',
                action: 'TEST_ACTION',
                details: 'Testing log persistence'
            })
            .select()
            .single();

        if (logError) {
            if (logError.code === '42P01') {
                console.error("❌ Table 'system_logs' DOES NOT EXIST.");
            } else {
                console.error("❌ Failed to insert system_log:", logError.message);
            }
        } else {
            console.log("✅ System Log inserted successfully:", log.id);
        }
    } catch (e) {
        console.error("❌ Exception testing logs:", e);
    }

    console.log("\n🏁 Verification Complete.");
}

verifyImplementation();
