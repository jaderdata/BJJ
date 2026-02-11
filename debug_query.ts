
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- EVENTOS ---');
    const { data: evs } = await supabase.from('events').select('id, name');
    evs?.forEach(e => console.log(`${e.id}: ${e.name}`));

    console.log('\n--- ACADEMIAS CONSULTADAS ---');
    const { data: acs } = await supabase.from('academies')
        .select('id, name')
        .or('name.ilike.%ASENJO%,name.ilike.%GUTO CAMPOS%');
    acs?.forEach(a => console.log(`${a.id}: ${a.name}`));

    if (acs) {
        const ids = acs.map(a => a.id);
        console.log('\n--- VISITAS DESSAS ACADEMIAS ---');
        const { data: vs } = await supabase.from('visits').select('id, event_id, academy_id, status').in('academy_id', ids);
        vs?.forEach(v => {
            const acName = acs.find(a => a.id === v.academy_id)?.name;
            const evName = evs?.find(e => e.id === v.event_id)?.name || 'Evento não encontrado';
            console.log(`Visita ${v.id} | Academia: ${acName} | Evento: ${evName} | Status: ${v.status}`);
        });
    }
}

checkData();
