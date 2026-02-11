import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMigration() {
    console.log('--- VERIFICANDO COLUNA IS_ACTIVE ---');
    const { data, error } = await supabase.from('event_academies').select('is_active').limit(1);

    if (error) {
        console.error('Erro ao verificar coluna is_active:', error.message);
        if (error.message.includes('column "is_active" does not exist')) {
            console.log('❌ A migração NÃO foi aplicada corretamente.');
        }
    } else {
        console.log('✅ Coluna is_active encontrada e funcionando!');
    }
}

verifyMigration();
