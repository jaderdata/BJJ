import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function reconcileData() {
    console.log("Reconciliando notificações com visitas atuais...");

    // 1. Pegar todas as notificações de conclusão de visita
    const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .ilike('message', '%concluiu uma visita%');

    // Extrair nomes das academias das mensagens
    // Formato: "O vendedor ... concluiu uma visita na academia \"NOME\"."
    const notifiedAcademies = notifications.map(n => {
        const match = n.message.match(/ academia "(.*)"\./);
        return { name: match ? match[1] : null, date: n.created_at };
    }).filter(a => a.name);

    // 2. Pegar todas as visitas concluídas atuais
    const { data: currentVisits } = await supabase
        .from('visits')
        .select('*, academies(name)')
        .eq('status', 'Visitada');

    const currentVisitedNames = new Set(currentVisits.map(v => v.academies.name));

    // 3. Identificar as perdidas (Notificadas mas não presentes como Visitada)
    const lostAcademies = notifiedAcademies.filter(n => !currentVisitedNames.has(n.name));

    // Remover duplicatas de nomes (notificações repetidas)
    const uniqueLost = [];
    const seen = new Set();
    lostAcademies.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(a => {
        if (!seen.has(a.name)) {
            uniqueLost.push(a);
            seen.add(a.name);
        }
    });

    console.log(`\n🚨 ACADEMIAS QUE FORAM VISITADAS MAS O REGISTRO SUMIU (${uniqueLost.length}):`);
    uniqueLost.forEach(l => console.log(`- ${l.name} | Última Notificação: ${l.date}`));

    // 4. Buscar vouchers por código se possível (tentar achar se restou algo)
    // Se o user compartilhou o link, o código existe.
    // Talvez possamos ver se há vouchers "perdidos" que não batem com nenhuma visita atual?
    const { data: allVouchers } = await supabase.from('vouchers').select('*');
    const { data: allVisits } = await supabase.from('visits').select('id');
    const validVisitIds = new Set(allVisits.map(v => v.id));

    const orphanedByVisit = allVouchers.filter(v => !validVisitIds.has(v.visit_id));
    console.log(`\n🎟️ Vouchers órfãos (visit_id inexistente): ${orphanedByVisit.length}`);
    if (orphanedByVisit.length > 0) {
        orphanedByVisit.forEach(v => console.log(`- Código: ${v.code} | Academia ID: ${v.academy_id}`));
    }
}

reconcileData();
