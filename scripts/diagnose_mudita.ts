
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 Iniciando diagnóstico para "MUDITA JIU JITSU"...');

    // 0. Autenticar como Admin (para ver todos os dados)
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'password123'
    });

    if (authError) {
        console.error('❌ Falha ao logar como Admin:', authError.message);
        return;
    }
    console.log('✅ Logado como Admin:', session?.user.email);

    // 1. Buscar Academia
    const { data: academies, error: academyError } = await supabase
        .from('academies')
        .select('*')
        .ilike('name', '%MUDITA%');

    if (academyError) {
        console.error('❌ Erro ao buscar academia:', academyError);
        return;
    }

    if (!academies || academies.length === 0) {
        console.error('❌ Nenhuma academia encontrada com "MUDITA".');
        return;
    }

    console.log(`✅ ${academies.length} academia(s) encontrada(s):`);
    academies.forEach(a => console.log(`   - [${a.id}] ${a.name} (Criada em: ${a.created_at})`));

    const academyId = academies[0].id;

    // 2. Buscar Visitas
    console.log(`\n🔍 Buscando visitas para academia ID: ${academyId}`);
    const { data: visits, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('academy_id', academyId)
        .order('created_at', { ascending: false });

    if (visitError) {
        console.error('❌ Erro ao buscar visitas:', visitError);
    } else {
        console.log(`✅ ${visits?.length || 0} visita(s) encontrada(s):`);
        visits?.forEach(v => {
            console.log(`   - [${v.id}] Status: ${v.status}, Evento: ${v.event_id}, Vendedor: ${v.salesperson_id}`);
            console.log(`     Criada: ${v.created_at}, Iniciada: ${v.start_time || v.started_at}, Finalizada: ${v.end_time || v.finished_at}`);
            console.log(`     Vouchers Gerados (JSON): ${JSON.stringify(v.vouchers_generated)}`);
        });
    }

    // 3. Buscar Vouchers
    console.log(`\n🔍 Buscando vouchers vinculados à academia ID: ${academyId}`);
    const { data: vouchers, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('academy_id', academyId);

    if (voucherError) {
        console.error('❌ Erro ao buscar vouchers:', voucherError);
    } else {
        console.log(`✅ ${vouchers?.length || 0} voucher(s) encontrado(s):`);
        vouchers?.forEach(v => console.log(`   - [${v.code}] Status: ${v.status}, Visita: ${v.visit_id}`));
    }
}

diagnose();
