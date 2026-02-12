import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function fixDurations() {
    console.log("🚀 Iniciando correção de durações no banco de dados...");

    // 1. Corrigir SQUAD BRAZILIAN JIU JITSU (Reduzir para 60 min se estiver maior)
    const { data: squadVisits } = await supabase
        .from('visits')
        .select('id, started_at, finished_at, academies(name)')
        .ilike('academies.name', '%SQUAD BRAZILIAN JIU JITSU%');

    if (squadVisits) {
        for (const v of squadVisits) {
            const start = new Date(v.started_at);
            const end = v.finished_at ? new Date(v.finished_at) : null;

            if (start && end) {
                const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                if (diff > 60) {
                    console.log(`  📍 Ajustando SQUAD (${v.id}): ${Math.round(diff)}min -> 60min`);
                    const newEnd = new Date(start.getTime() + 60 * 60 * 1000); // +60 mins
                    await supabase.from('visits').update({ finished_at: newEnd.toISOString() }).eq('id', v.id);
                }
            }
        }
    }

    // 2. Corrigir Visitas de 0 minutos -> 30 minutos
    const { data: allVisits } = await supabase.from('visits').select('id, started_at, finished_at');

    let zeroCount = 0;
    if (allVisits) {
        for (const v of allVisits) {
            if (!v.started_at || !v.finished_at) continue;

            const start = new Date(v.started_at);
            const end = new Date(v.finished_at);
            const diff = (end.getTime() - start.getTime()) / (1000 * 60);

            if (diff >= -1 && diff <= 1) { // Pega 0 ou quase 0 (erros de milissegundos)
                zeroCount++;
                const newEnd = new Date(start.getTime() + 30 * 60 * 1000); // +30 mins
                await supabase.from('visits').update({ finished_at: newEnd.toISOString() }).eq('id', v.id);
            }
        }
    }

    console.log(`\n✅ Correção concluída!`);
    console.log(`   - Visitas de 0min ajustadas para 30min: ${zeroCount}`);
}

fixDurations();
