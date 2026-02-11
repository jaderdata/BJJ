import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvents() {
    console.log('--- EVENTOS E CONTAGEM DE VOUCHERS ---');
    const { data: events } = await supabase.from('events').select('id, name');
    const { data: vouchers } = await supabase.from('vouchers').select('event_id');

    const counts = {};
    vouchers.forEach(v => {
        counts[v.event_id] = (counts[v.event_id] || 0) + 1;
    });

    events.forEach(e => {
        console.log(`Evento: ${e.name} | Vouchers: ${counts[e.id] || 0}`);
    });
}

checkEvents();
