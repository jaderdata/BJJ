import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function verifyVoucherLinks() {
    console.log("Checking voucher data in DB...");

    // Check total count
    const { count, error: cError } = await supabase.from('vouchers').select('*', { count: 'exact', head: true });
    console.log(`Total vouchers in DB: ${count}`);

    // Fetch a sample of restored vouchers with their visit and academy names
    const { data: vouchers, error } = await supabase
        .from('vouchers')
        .select('code, visit_id, academy_id, academies(name)')
        .limit(10);

    if (error) {
        console.error("Error fetching vouchers:", error);
        return;
    }

    console.log("\nSample Vouchers:");
    vouchers.forEach(v => {
        console.log(`- Code: ${v.code} | Academy: ${v.academies?.name} | Visit ID: ${v.visit_id}`);
    });

    // Check if any visit has no vouchers linked
    const { data: visits } = await supabase.from('visits').select('id, academies(name), vouchers(code)');
    console.log("\nVisits and their voucher codes:");
    visits?.forEach(v => {
        const codes = v.vouchers?.map(vo => vo.code).join(', ') || 'NONE';
        console.log(`- ${v.academies?.name}: [${codes}]`);
    });
}
verifyVoucherLinks();
