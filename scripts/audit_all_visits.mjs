import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllVisits() {
    console.log('--- AUDITORIA: LISTANDO TODAS AS VISITAS DO BANCO ---');
    const { data: visits, error: vErr } = await supabase.from('visits')
        .select('*, academies(name)')
        .order('created_at', { ascending: false });

    if (vErr) {
        console.error('Erro ao buscar visitas:', vErr);
        return;
    }

    console.log('Total de visitas no banco:', visits.length);
    visits.forEach(v => {
        console.log(`Academia: ${v.academies?.name || 'DESCONHECIDA'} | ID: ${v.id} | Status: ${v.status} | Data: ${v.created_at}`);
    });
}

listAllVisits();
