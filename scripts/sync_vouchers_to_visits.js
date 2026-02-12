import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function syncVouchers() {
    console.log("🔄 Sincronizando vouchers_generated na tabela visits...");

    // 1. Buscar todos os vouchers
    const { data: vouchers, error: vError } = await supabase.from('vouchers').select('code, visit_id');
    if (vError) throw vError;

    // 2. Agrupar por visit_id
    const groups = {};
    vouchers.forEach(v => {
        if (!v.visit_id) return;
        if (!groups[v.visit_id]) groups[v.visit_id] = [];
        groups[v.visit_id].push(v.code);
    });

    console.log(`Encontradas ${Object.keys(groups).length} visitas para atualizar.`);

    // 3. Atualizar cada visita
    for (const [visitId, codes] of Object.entries(groups)) {
        console.log(`- Atualizando visita ${visitId} com ${codes.length} vouchers...`);
        const { error: updateError } = await supabase
            .from('visits')
            .update({ vouchers_generated: codes })
            .eq('id', visitId);

        if (updateError) {
            console.error(`  ❌ Erro ao atualizar visita ${visitId}:`, updateError.message);
        }
    }

    console.log("\n✨ Sincronização concluída!");
}

syncVouchers();
