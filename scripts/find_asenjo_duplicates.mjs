import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findAsenjoDuplicates() {
    console.log('--- BUSCANDO POSSÍVEIS DUPLICATAS DE ASENJO ---');
    const { data: academies } = await supabase.from('academies').select('id, name').ilike('name', '%Asenjo%');
    console.log('Academias encontradas:', JSON.stringify(academies, null, 2));

    if (academies.length > 1) {
        const ids = academies.map(a => a.id);
        const { data: vouchers } = await supabase.from('vouchers').select('*').in('academy_id', ids);
        console.log('Vouchers encontrados para estas academias:', JSON.stringify(vouchers, null, 2));
    } else {
        console.log('Nenhuma duplicata encontrada pelo nome.');
    }
}

findAsenjoDuplicates();
