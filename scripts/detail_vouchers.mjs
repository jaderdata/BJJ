import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function detailVouchers() {
    console.log('--- DETALHAMENTO DE TODOS OS 39 VOUCHERS ---');
    const { data: vouchers, error } = await supabase.from('vouchers')
        .select('*, academies(name), events(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro:', error);
        return;
    }

    vouchers.forEach((v, index) => {
        console.log(`${index + 1}. Código: ${v.code} | Academia: ${v.academies?.name || '---'} | Evento: ${v.events?.name || '---'} | Data: ${v.created_at}`);
    });
}

detailVouchers();
