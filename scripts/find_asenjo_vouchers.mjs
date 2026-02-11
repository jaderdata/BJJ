import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findAsenjoVouchers() {
    const visitId = 'd93ccb39-3103-4cf2-8494-799b3067c851';
    console.log(`--- BUSCANDO VOUCHERS PARA A VISITA ASENJO (${visitId}) ---`);
    const { data: vouchers, error: vErr } = await supabase.from('vouchers').select('*').eq('visit_id', visitId);

    if (vErr) {
        console.error('Erro ao buscar vouchers:', vErr);
        return;
    }

    console.log('Vouchers encontrados:', JSON.stringify(vouchers, null, 2));

    if (vouchers.length === 0) {
        console.log('Nenhum voucher encontrado diretamente vinculado a esta visita.');
        // Tentar buscar por academy_id para garantir
        const academyId = '25752174-a633-47cb-8c9e-5c4d3701264b'; // ID da ASENJO se eu lembrar, mas vou buscar dinamicamente
        console.log('\n--- BUSCANDO POR ACADEMY_ID (ASENJO) ---');
        const { data: ac, error: aErr } = await supabase.from('academies').select('id').ilike('name', '%Asenjo%').single();
        if (ac) {
            const { data: v2 } = await supabase.from('vouchers').select('*').eq('academy_id', ac.id);
            console.log('Vouchers por Academy ID:', JSON.stringify(v2, null, 2));
        }
    }
}

findAsenjoVouchers();
