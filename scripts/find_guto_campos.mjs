import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findGuto() {
    console.log('--- BUSCANDO GUTO CAMPOS ---');
    const { data: academies, error: aErr } = await supabase.from('academies').select('id, name').ilike('name', '%Guto Campos%');
    if (aErr) {
        console.error('Erro ao buscar academia:', aErr);
        return;
    }
    console.log('Academias encontradas:', JSON.stringify(academies, null, 2));

    if (academies.length > 0) {
        const academyId = academies[0].id;
        console.log('\n--- BUSCANDO VISITAS PARA ESTA ACADEMIA ---');
        const { data: visits, error: vErr } = await supabase.from('visits').select('*, events(name)').eq('academy_id', academyId);
        if (vErr) {
            console.error('Erro ao buscar visitas:', vErr);
            return;
        }
        console.log('Visitas encontradas:', JSON.stringify(visits, null, 2));
    } else {
        console.log('Nenhuma academia Guto Campos encontrada.');
    }
}

findGuto();
