import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkVisitText() {
    const visitId = 'd93ccb39-3103-4cf2-8494-799b3067c851';
    console.log(`--- ANALISANDO NOTAS E SUMÁRIO DA VISITA ${visitId} ---`);
    const { data: visit, error } = await supabase.from('visits').select('id, notes, summary, status').eq('id', visitId).single();

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Dados da Visita:', JSON.stringify(visit, null, 2));
}

checkVisitText();
