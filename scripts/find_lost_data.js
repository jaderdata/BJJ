import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabaseUrl = env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findLostData() {
    console.log("🔍 Iniciando busca por dados perdidos...");

    // 1. Verificar vouchers sem visitas associadas (órfãos)
    // Nota: Se o cascade deletou os vouchers, esta busca retornará vazio.
    const { data: orphanedVouchers, error: vError } = await supabase
        .from('vouchers')
        .select('*, academies(name)')
        .is('visit_id', null);

    if (vError) console.error("Erro ao buscar vouchers órfãos:", vError);
    else console.log(`Encontrados ${orphanedVouchers.length} vouchers órfãos.`);

    // 2. Verificar o histórico de notificações/logs (se houver) para identificar quais academias foram visitadas
    // O App chama notifyUser ao finalizar visita. Vamos ver se temos esses logs.
    const { data: notifications, error: nError } = await supabase
        .from('notifications')
        .select('*')
        .ilike('message', '%concluiu uma visita%');

    if (nError) console.error("Erro ao buscar notificações:", nError);
    else {
        console.log(`Encontradas ${notifications.length} notificações de visitas concluídas.`);
        notifications.forEach(n => console.log(`- ${n.message} (${n.created_at})`));
    }

    // 3. Verificar academias que estão em eventos mas não possuem registro de visita (Pendente)
    const { data: eventAcademies, error: eaError } = await supabase
        .from('event_academies')
        .select('*, academies(name, id), events(name, id)');

    // Buscar todas as visitas existentes
    const { data: allVisits } = await supabase.from('visits').select('academy_id, event_id, status');

    const missingVisits = eventAcademies.filter(ea => {
        const visit = allVisits.find(v => v.academy_id === ea.academy_id && v.event_id === ea.event_id);
        return !visit; // Academias sem NENHUM registro de visita
    });

    console.log(`\nAcademias em eventos SEM registro de visita: ${missingVisits.length}`);
    missingVisits.forEach(m => console.log(`- Academia: ${m.academies.name} | Evento: ${m.events.name}`));
}

findLostData();
