import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function checkConstraints() {
    console.log("Checking constraints on vouchers table...");

    // We can't query information_schema directly with supabase-js easily unless we have a function
    // But we can try to find if there are ANY records in vouchers that mention a deleted visit_id
    // Wait, the user wants the data back.

    // Let's try to find "Lost" vouchers by checking if there are notifications for vouchers generated
    const { data: voucherNotifications } = await supabase
        .from('notifications')
        .select('*')
        .ilike('message', '%voucher%');

    console.log(`Voucher notifications: ${voucherNotifications?.length || 0}`);
}
checkConstraints();
