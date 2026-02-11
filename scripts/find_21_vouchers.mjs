import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function find21Vouchers() {
    console.log('--- BUSCANDO TODOS OS EVENTOS E CONTAGEM DE VOUCHERS ---');
    const { data: events } = await supabase.from('events').select('id, name');
    const { data: vouchers } = await supabase.from('vouchers').select('event_id');

    const counts = {};
    vouchers.map(v => {
        counts[v.event_id] = (counts[v.event_id] || 0) + 1;
    });

    console.log('Resultados encontrados no Banco:');
    events.forEach(e => {
        console.log(`Evento: "${e.name}" | ID: ${e.id} | Vouchers no Banco: ${counts[e.id] || 0}`);
    });

    const orphanCount = vouchers.filter(v => !v.event_id).length;
    console.log(`\nVouchers sem Evento vinculado: ${orphanCount}`);
}

find21Vouchers();
