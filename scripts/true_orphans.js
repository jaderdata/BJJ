import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findOrphansForReal() {
    // 1. All vouchers
    const { data: vouchers } = await supabase.from('vouchers').select('*, academies(name)');

    // 2. All visits
    const { data: visits } = await supabase.from('visits').select('id');
    const validIds = new Set(visits.map(v => v.id));

    // 3. Find vouchers whose visit_id is not in validIds
    const trueOrphans = vouchers.filter(v => !validIds.has(v.visit_id));

    console.log(`Verdadeiros vouchers órfãos encontrados: ${trueOrphans.length}`);
    trueOrphans.forEach(v => {
        console.log(`- Código: ${v.code} | Academia: ${v.academies?.name} | Visit ID: ${v.visit_id}`);
    });
}
findOrphansForReal();
