import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function scanVouchersByDate() {
    console.log('--- ESCANEANDO VOUCHERS POR DATA (6 DE FEVEREIRO) ---');
    const { data: vouchers, error: vErr } = await supabase.from('vouchers')
        .select('*, academies(name)')
        .gte('created_at', '2026-02-06T14:30:00Z')
        .lte('created_at', '2026-02-06T16:00:00Z');

    if (vErr) {
        console.error('Erro ao buscar vouchers:', vErr);
        return;
    }

    console.log('Vouchers encontrados no período:', JSON.stringify(vouchers, null, 2));
}

scanVouchersByDate();
