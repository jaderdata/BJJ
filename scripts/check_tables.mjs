import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    console.log('📋 Listando tabelas disponíveis...\n');

    // Tentar listar algumas tabelas comuns
    const tables = ['users', 'profiles', 'accounts', 'academies', 'events', 'visits'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`✅ Tabela encontrada: ${table}`);
            if (data && data.length > 0) {
                console.log(`   Colunas:`, Object.keys(data[0]));
            }
        }
    }
}

listTables();
