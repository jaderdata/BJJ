import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function inspectVisits() {
    const { data: visits, error } = await supabase
        .from('visits')
        .select(`
            *,
            academies (name),
            vouchers (id)
        `);

    if (error) {
        console.error("Erro ao buscar visitas:", error);
        return;
    }

    if (!visits) {
        console.log("Nenhuma visita encontrada.");
        return;
    }

    console.log(`Status de todas as visitas encontradas (${visits.length}):`);
    visits.forEach(v => {
        console.log(`- Academia: ${v.academies?.name || 'Desconhecida'} | Status: ${v.status} | ID: ${v.id} | Vouchers: ${v.vouchers?.length || 0}`);
    });
}
inspectVisits();
