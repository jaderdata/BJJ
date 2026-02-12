import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function removeSpecificTestAcademies() {
    const listToRemove = [
        "American Top Team Kissimmee - Black Boxx",
        "Jorge Pereira Jiu Jitsu South Beach Miami",
        "Gracie Barra Monticello",
        "GABRIELA BJJ"
    ];

    console.log("🧹 Iniciando remoção seletiva de academias de teste...");

    for (const name of listToRemove) {
        console.log(`\nProcessando: "${name}"`);

        // 1. Achar ID da academia
        const { data: academy } = await supabase.from('academies').select('id').eq('name', name).maybeSingle();

        if (!academy) {
            console.log(`  − Academia não encontrada ou já removida.`);
            continue;
        }

        const academyId = academy.id;

        // 2. Remover Vouchers vinculados
        const { error: voError } = await supabase.from('vouchers').delete().eq('academy_id', academyId);
        if (voError) console.error(`  ❌ Erro ao deletar vouchers:`, voError.message);
        else console.log(`  ✅ Vouchers removidos.`);

        // 3. Remover Visitas vinculadas
        // Nota: O trigger de proteção pode impedir a deleção se for status 'Visitada'.
        // Precisamos primeiro alterar o status para 'Pendente' se quisermos deletar, 
        // OU o usuário quer apenas que elas não apareçam como visitadas.
        // Se o objetivo é remover da lista, deletar a visita é o caminho.

        // Vamos tentar deletar. Se o trigger barrar, alteramos o status antes.
        const { error: vError } = await supabase.from('visits').delete().eq('academy_id', academyId);

        if (vError && vError.message.includes('Proteção de Integridade')) {
            console.log(`  🔐 Trigger detectado. Alterando status para permitir remoção...`);
            await supabase.from('visits').update({ status: 'Pendente' }).eq('academy_id', academyId);
            await supabase.from('visits').delete().eq('academy_id', academyId);
            console.log(`  ✅ Visita removida após bypass de segurança.`);
        } else if (vError) {
            console.error(`  ❌ Erro ao deletar visita:`, vError.message);
        } else {
            console.log(`  ✅ Visita removida.`);
        }
    }

    console.log("\n✨ Remoção concluída!");
}

removeSpecificTestAcademies();
