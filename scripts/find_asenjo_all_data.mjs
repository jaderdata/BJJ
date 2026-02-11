import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findAsenjoVisits() {
    console.log('--- BUSCANDO ACADEMIA ASENJO ---');
    const { data: academy } = await supabase.from('academies').select('id, name').ilike('name', '%Asenjo%').single();
    if (!academy) {
        console.log('Academia não encontrada.');
        return;
    }
    console.log(`Academia: ${academy.name} (ID: ${academy.id})`);

    console.log('\n--- BUSCANDO TODAS AS VISITAS DESTA ACADEMIA ---');
    const { data: visits } = await supabase.from('visits').select('*').eq('academy_id', academy.id);
    console.log(`Total de visitas: ${visits.length}`);
    console.log(JSON.stringify(visits, null, 2));

    if (visits.length > 0) {
        const visitIds = visits.map(v => v.id);
        console.log('\n--- BUSCANDO VOUCHERS PARA ESTAS VISITAS ---');
        const { data: vouchers } = await supabase.from('vouchers').select('*').in('visit_id', visitIds);
        console.log(`Total de vouchers encontrados: ${vouchers.length}`);
        console.log(JSON.stringify(vouchers, null, 2));
    }
}

findAsenjoVisits();
