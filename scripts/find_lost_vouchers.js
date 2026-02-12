import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findLostVouchers() {
    console.log("🔍 Investigando correlação de dados...");

    // 1. Notificações de visitas finalizadas
    const { data: notifications } = await supabase.from('notifications').select('*').ilike('message', '%concluiu uma visita%');
    const notifiedMap = new Map();
    notifications.forEach(n => {
        const match = n.message.match(/ academia "(.*)"\./);
        if (match) notifiedMap.set(match[1], n.created_at);
    });

    // 2. Visitas atuais
    const { data: visits } = await supabase.from('visits').select('*, academies(name), vouchers(code)');
    const visitedSet = new Set(visits.map(v => v.academies?.name));

    // 3. Vouchers atuais
    const { data: allVouchers } = await supabase.from('vouchers').select('*, academies(name)');

    console.log("\n--- RESULTADO DA BUSCHA ---");

    const missingAcademies = Array.from(notifiedMap.keys()).filter(name => !visitedSet.has(name));

    if (missingAcademies.length === 0) {
        console.log("Nenhuma academia missing encontrada (todas as notificações batem com visitas atuais).");
    } else {
        console.log(`Encontradas ${missingAcademies.length} academias que foram visitadas mas não possuem registro de visita 'Visitada':`);
        missingAcademies.forEach(name => {
            console.log(`\n🚨 ACADEMIA: ${name}`);
            console.log(`   Data Notificação: ${notifiedMap.get(name)}`);

            // Tentar achar vouchers dessa academia que sobraram
            const matchingVouchers = allVouchers.filter(v => v.academies?.name === name);
            if (matchingVouchers.length > 0) {
                console.log(`   ✅ Vouchers encontrados (${matchingVouchers.length}):`);
                matchingVouchers.forEach(v => console.log(`      - Code: ${v.code} | Visit ID: ${v.visit_id}`));
            } else {
                console.log("   ❌ NENHUM VOUCHER ENCONTRADO (Provavelmente deletado pelo cascade).");
            }
        });
    }

    // 4. Checar se existem visitas 'Pendente' que deveriam ser 'Visitada'
    const pendingWithVouchers = visits.filter(v => v.status === 'Pendente' && v.vouchers?.length > 0);
    if (pendingWithVouchers.length > 0) {
        console.log("\n⚠️ ALERTA: Visitas PENDENTES que possuem vouchers associados:");
        pendingWithVouchers.forEach(v => console.log(`- ${v.academies?.name} (ID: ${v.id})`));
    }
}

findLostVouchers();
