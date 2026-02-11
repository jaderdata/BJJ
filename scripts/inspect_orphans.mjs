import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectOrphanVisits() {
    console.log('--- INSPEÇÃO DE VISITAS ÓRFÃS (SEM ACADEMIA VINCULADA) ---');
    const { data: visits, error: vErr } = await supabase.from('visits')
        .select('*')
        .is('academy_id', null);

    if (vErr) {
        console.error('Erro ao buscar visitas:', vErr);
        return;
    }

    console.log('Total de visitas órfãs:', visits.length);
    visits.forEach(v => {
        console.log(`ID: ${v.id} | Status: ${v.status} | Notas: ${v.notes} | Sumário: ${v.summary}`);
    });
}

inspectOrphanVisits();
