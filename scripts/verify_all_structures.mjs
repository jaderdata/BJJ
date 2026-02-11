import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAllMigrations() {
    console.log('--- VERIFICANDO ESTRUTURA FINAL ---');

    // 1. Verificando Events (Sandbox)
    const { data: eventData, error: eventError } = await supabase.from('events').select('is_test').limit(1);
    if (eventError) {
        console.error('❌ Coluna is_test (Events) não encontrada:', eventError.message);
    } else {
        console.log('✅ Coluna is_test (Events) OK!');
    }

    // 2. Verificando Event Academies (Soft-Delete)
    const { data: eaData, error: eaError } = await supabase.from('event_academies').select('is_active').limit(1);
    if (eaError) {
        console.error('❌ Coluna is_active (Event Academies) não encontrada:', eaError.message);
    } else {
        console.log('✅ Coluna is_active (Event Academies) OK!');
    }
}

verifyAllMigrations();
