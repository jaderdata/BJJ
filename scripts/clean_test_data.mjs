import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanTestData() {
    console.log('--- LIMPANDO DADOS DE TESTE ---');

    // 1. Encontrar o evento de teste
    const { data: testEvents } = await supabase.from('events')
        .select('id, name')
        .ilike('name', '%TESTE%');

    if (!testEvents || testEvents.length === 0) {
        console.log('Nenhum evento de teste encontrado.');
        return;
    }

    const testEventIds = testEvents.map(e => e.id);
    console.log(`Eventos de teste identificados: ${testEvents.map(e => e.name).join(', ')}`);

    // 2. Deletar vouchers vinculados a esses eventos
    const { count: vCount, error: vErr } = await supabase.from('vouchers')
        .delete({ count: 'exact' })
        .in('event_id', testEventIds);

    if (vErr) {
        console.error('Erro ao deletar vouchers:', vErr);
    } else {
        console.log(`✅ ${vCount} vouchers de teste removidos.`);
    }

    // 3. Deletar visitas vinculadas a esses eventos (opcional, mas recomendado para limpeza total)
    const { count: visCount, error: visErr } = await supabase.from('visits')
        .delete({ count: 'exact' })
        .in('event_id', testEventIds);

    if (visErr) {
        console.error('Erro ao deletar visitas:', visErr);
    } else {
        console.log(`✅ ${visCount} visitas de teste removidas.`);
    }

    // 4. Deletar os eventos de teste
    const { count: eCount, error: eErr } = await supabase.from('events')
        .delete({ count: 'exact' })
        .in('id', testEventIds);

    if (eErr) {
        console.error('Erro ao deletar eventos:', eErr);
    } else {
        console.log(`✅ ${eCount} eventos de teste removidos.`);
    }

    console.log('\n--- LIMPEZA CONCLUÍDA ---');
}

cleanTestData();
