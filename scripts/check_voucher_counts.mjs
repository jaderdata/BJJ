import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCounts() {
    console.log('--- CONTAGEM DE VOUCHERS POR EVENTO ---');
    const { data: vouchers, error } = await supabase.from('vouchers').select('*, events(name)');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    const counts = {};
    vouchers.forEach(v => {
        const name = v.events?.name || 'Sem Evento';
        counts[name] = (counts[name] || 0) + 1;
    });

    console.log(JSON.stringify(counts, null, 2));
}

checkCounts();
