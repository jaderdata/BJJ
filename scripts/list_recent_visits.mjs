import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listRecentVisits() {
    console.log('--- LISTANDO TODAS AS VISITAS CONCLUÍDAS (ÚLTIMOS 7 DIAS) ---');
    const { data: visits, error: vErr } = await supabase.from('visits')
        .select('*, academies(name)')
        .eq('status', 'VISITED')
        .order('created_at', { ascending: false });

    if (vErr) {
        console.error('Erro ao buscar visitas:', vErr);
        return;
    }

    console.log('Total de visitas concluídas encontradas:', visits.length);
    visits.forEach(v => {
        console.log(`Academia: ${v.academies?.name || 'DESCONHECIDA'} | ID Visita: ${v.id} | Data: ${v.created_at}`);
    });
}

listRecentVisits();
