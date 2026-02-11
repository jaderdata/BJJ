import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAllVouchers() {
    console.log('--- AUDITORIA: LISTANDO TODOS OS VOUCHERS DO SISTEMA ---');
    const { data: vouchers, error } = await supabase.from('vouchers').select('*, academies(name)');

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log(`Total de vouchers: ${vouchers.length}`);
    vouchers.forEach(v => {
        console.log(`Código: ${v.code} | Academia: ${v.academies?.name || '---'} | ID Academia: ${v.academy_id}`);
    });
}

listAllVouchers();
