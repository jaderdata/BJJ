import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function countVouchers() {
    console.log('--- AUDITORIA: CONTANDO VOUCHERS NO BANCO ---');
    const { count, error } = await supabase.from('vouchers').select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Total de vouchers registrados:', count);
}

countVouchers();
