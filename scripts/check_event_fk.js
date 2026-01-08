
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEventSchema() {
    console.log("🕵️ Checking 'events' table structure and constraints...\n");

    // We can't easily query information_schema via the JS client with restricted permissions usually,
    // but we can try to insert a dummy event with a fake salesperson ID to see the specific error message.

    // 1. Try to create an event with a random UUID as salesperson_id
    const randomId = '00000000-0000-0000-0000-000000000000';

    console.log("1. Attempting insert with random salesperson_id (Test FK)...");
    const { data, error } = await supabase.from('events').insert({
        name: 'Test Event Schema',
        city: 'Test City',
        state: 'TS',
        address: '123 Test St',
        status: 'PLANNED',
        salesperson_id: randomId,
        event_date: new Date().toISOString()
    }).select();

    if (error) {
        console.error("❌ Insert Failed:");
        console.error("   Code:", error.code);
        console.error("   Message:", error.message);
        console.error("   Details:", error.details);

        if (error.message.includes('foreign key constraint')) {
            console.log("\n⚠️ DIAGNOSIS: The 'salesperson_id' column has a foreign key constraint pointing to 'auth.users'.");
            console.log("   Since we moved to 'app_users', this constraint blocks us from assigning events to our new users.");
        }
    } else {
        console.log("✅ Insert Succeeded! (No FK constraint blocking random IDs)");
        // Cleanup
        await supabase.from('events').delete().eq('id', data[0].id);
    }
}

checkEventSchema();
