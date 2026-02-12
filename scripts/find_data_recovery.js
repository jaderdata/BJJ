
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findAcademyData() {
    console.log("🔍 Searching for SQUAD and Fabin Rosa...");

    // 0. Authenticate
    const email = 'verifier.admin@bjjvisits.com';
    const password = 'StrongVerifierPassword123!';
    await supabase.auth.signInWithPassword({ email, password });

    // 1. Find Academies
    const { data: academies, error: acadError } = await supabase
        .from('academies')
        .select('id, name')
        .or('name.ilike.%SQUAD%,name.ilike.%Fabin Rosa%');

    if (acadError) {
        console.error("❌ Error finding academies:", acadError);
        return;
    }

    console.log(`\n🏫 Found ${academies.length} academies:`);
    academies.forEach(a => console.log(`   - [${a.id}] ${a.name}`));

    if (academies.length === 0) return;

    const academyIds = academies.map(a => a.id);

    // 2. Find Visits
    const { data: visits, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .in('academy_id', academyIds);

    if (visitError) console.error("❌ Error finding visits:", visitError);
    else {
        console.log(`\n🚶 Found ${visits.length} visits:`);
        visits.forEach(v => console.log(`   - [${v.id}] Status: ${v.status} | Academy: ${v.academy_id} | Created: ${v.created_at}`));
    }

    // 3. Find Vouchers
    const { data: vouchers, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .in('academy_id', academyIds);

    if (voucherError) console.error("❌ Error finding vouchers:", voucherError);
    else {
        console.log(`\n🎟️ Found ${vouchers.length} vouchers:`);
        vouchers.forEach(v => console.log(`   - Code: ${v.code} | Academy: ${v.academy_id} | Visit Link: ${v.visit_id}`));
    }
}

findAcademyData();
