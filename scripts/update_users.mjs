import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
// Você precisa usar a SERVICE ROLE KEY para gerenciar usuários
// A anon key não tem permissão para criar/deletar usuários
const supabaseServiceKey = 'COLE_AQUI_SUA_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function updateUsers() {
    console.log('🔄 Gerenciando usuários no Supabase Auth...\n');
    console.log('⚠️  IMPORTANTE: Este script precisa da SERVICE ROLE KEY do Supabase\n');
    console.log('📝 Como obter a SERVICE ROLE KEY:');
    console.log('   1. Acesse https://supabase.com/dashboard');
    console.log('   2. Selecione seu projeto');
    console.log('   3. Vá em Settings → API');
    console.log('   4. Copie a "service_role" key (não a anon key!)');
    console.log('   5. Cole no script e execute novamente\n');
    console.log('─'.repeat(60));
    console.log('\n📋 USUÁRIOS A SEREM CRIADOS:\n');
    console.log('✅ Admin:');
    console.log('   Email: jader_dourado@hotmail.com');
    console.log('   Senha: 12345');
    console.log('   Role: ADMIN\n');
    console.log('✅ Vendedor 1:');
    console.log('   Email: vendedor1@teste.com');
    console.log('   Senha: 12345');
    console.log('   Role: SALESPERSON\n');
    console.log('✅ Vendedor 2:');
    console.log('   Email: vendedor2@teste.com');
    console.log('   Senha: 12345');
    console.log('   Role: SALESPERSON\n');
    console.log('─'.repeat(60));
    console.log('\n💡 ALTERNATIVA MANUAL:');
    console.log('   Você pode criar os usuários manualmente no painel do Supabase:');
    console.log('   1. Acesse https://supabase.com/dashboard');
    console.log('   2. Vá em Authentication → Users');
    console.log('   3. Clique em "Add user" → "Create new user"');
    console.log('   4. Preencha email e senha para cada usuário');
    console.log('   5. Depois, atualize a tabela "profiles" com o role correto\n');
}

updateUsers();
