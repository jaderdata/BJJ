import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function syncAndCleanup() {
    const targetEventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26'; // PBJJF Orlando Spring International Open 2026

    console.log("🚀 Iniciando ajuste e sincronização...");

    // 1. Identificar e Remover Visitas/Vouchers de Academias de Teste
    // Vamos buscar todas as academias que tenham "test" ou "teste" no nome e deletar suas visitas
    const { data: testAcademies } = await supabase
        .from('academies')
        .select('id, name')
        .or('name.ilike.%test%,name.ilike.%teste%');

    if (testAcademies && testAcademies.length > 0) {
        const testIds = testAcademies.map(a => a.id);
        console.log(`🧹 Removendo ${testAcademies.length} academias de teste e seus registros vinculados...`);

        // Deletar vouchers de academias de teste
        await supabase.from('vouchers').delete().in('academy_id', testIds);
        // Deletar visitas de academias de teste
        await supabase.from('visits').delete().in('academy_id', testIds);

        console.log("✅ Registros de teste removidos.");
    }

    // 2. Sincronizar Vouchers APENAS para o evento selecionado
    console.log(`\n🔄 Sincronizando vouchers para o evento: PBJJF Orlando Spring...`);

    // Pegar todas as visitas do evento
    const { data: visits, error: vError } = await supabase
        .from('visits')
        .select('id, academy_id')
        .eq('event_id', targetEventId);

    if (vError) throw vError;

    // Pegar todos os vouchers desse evento
    const { data: vouchers, error: voError } = await supabase
        .from('vouchers')
        .select('code, visit_id')
        .eq('event_id', targetEventId);

    if (voError) throw voError;

    // Agrupar
    const visitVoucherMap = {};
    vouchers.forEach(vo => {
        if (!vo.visit_id) return;
        if (!visitVoucherMap[vo.visit_id]) visitVoucherMap[vo.visit_id] = [];
        visitVoucherMap[vo.visit_id].push(vo.code);
    });

    console.log(`Encontradas ${visits.length} visitas no evento para processar.`);

    for (const visit of visits) {
        const codes = visitVoucherMap[visit.id] || [];

        // Atualizar o array vouchers_generated na tabela visits
        const { error: updateError } = await supabase
            .from('visits')
            .update({ vouchers_generated: codes })
            .eq('id', visit.id);

        if (updateError) {
            console.error(`  ❌ Erro ao sincronizar visita ${visit.id}:`, updateError.message);
        } else {
            console.log(`  ✅ Visita ${visit.id} sincronizada com ${codes.length} vouchers.`);
        }
    }

    console.log("\n✨ Ajuste e Sincronização concluídos com sucesso!");
}

syncAndCleanup();
