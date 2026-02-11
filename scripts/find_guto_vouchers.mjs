import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findVouchers() {
    const academyId = '11ba3cd9-e468-452e-b2fd-5e6e1c1b0b72';
    console.log('--- BUSCANDO VOUCHERS PARA GUTO CAMPOS ---');
    const { data: vouchers, error: vErr } = await supabase.from('vouchers').select('*').eq('academy_id', academyId);
    if (vErr) {
        console.error('Erro ao buscar vouchers:', vErr);
        return;
    }
    console.log('Vouchers encontrados:', JSON.stringify(vouchers, null, 2));

    if (vouchers.length === 0) {
        console.log('Nenhum voucher encontrado para esta academia.');
    }
}

findVouchers();
