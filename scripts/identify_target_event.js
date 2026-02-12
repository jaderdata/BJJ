import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function identifyTargetData() {
    // 1. Get Event ID
    const { data: event } = await supabase.from('events').select('id, name').ilike('name', '%PBJJF Orlando Spring International Open 2026%').single();
    console.log("🎯 Evento Alvo:", event?.name, "| ID:", event?.id);

    if (!event) return;

    // 2. Find "Test" Academies with visits in this event
    const { data: visits } = await supabase.from('visits').select('id, academy_id, academies(name)').eq('event_id', event.id);

    console.log("\n🏫 Analisando Academias no Evento:");
    const testVisits = visits.filter(v =>
        v.academies?.name.toLowerCase().includes('test') ||
        v.academies?.name.toLowerCase().includes('academia teste')
    );

    if (testVisits.length > 0) {
        console.log(`\n🚨 Academias de TESTE encontradas (${testVisits.length}):`);
        testVisits.forEach(v => console.log(`- ${v.academies?.name} (Visit ID: ${v.id})`));
    } else {
        console.log("\n✅ Nenhuma academia de teste óbvia encontrada neste evento.");
    }
}
identifyTargetData();
