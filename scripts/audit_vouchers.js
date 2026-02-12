import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function auditVouchers() {
    const { data: vouchers } = await supabase.from('vouchers').select('*, academies(name)');

    console.log("Auditoria de Vouchers (30 totais):");
    const stats = {};
    vouchers.forEach(v => {
        const name = v.academies?.name || 'Desconhecida';
        stats[name] = (stats[name] || 0) + 1;
    });
    console.log(stats);
}
auditVouchers();
