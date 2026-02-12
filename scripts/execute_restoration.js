import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

const generateVoucherCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return code;
};

async function restoreData() {
    const salespersonId = '340ffcb3-7671-41e7-9bb9-675208d905fa'; // jaderdata@gmail.com
    const dataToRestore = [
        { name: "American Top Team Kissimmee - Black Boxx", date: "2026-02-06T22:01:00.637Z", eventId: "dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26" },
        { name: "Asenjo Brazilian Jiu-Jitsu", date: "2026-02-06T15:25:47.422Z", eventId: "dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26" },
        { name: "Jorge Pereira Jiu Jitsu South Beach Miami", date: "2026-02-06T15:16:45.463Z", eventId: "dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26" },
        { name: "Gracie Barra Monticello", date: "2026-02-02T16:44:52.248Z", eventId: "dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26" },
        { name: "GABRIELA BJJ", date: "2026-02-02T16:15:04.243Z", eventId: "dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26" }
    ];

    console.log("🚀 Iniciando restauração técnica...");

    for (const item of dataToRestore) {
        console.log(`\nRestaurando: ${item.name}...`);

        // 1. Buscar ID da academia
        const { data: academy } = await supabase.from('academies').select('id').eq('name', item.name).single();
        if (!academy) {
            console.error(`❌ Academia não encontrada no banco: ${item.name}`);
            continue;
        }

        // 2. Criar Visita
        const { data: visit, error: vError } = await supabase.from('visits').insert({
            academy_id: academy.id,
            event_id: item.eventId,
            salesperson_id: salespersonId,
            status: 'Visitada',
            started_at: item.date,
            finished_at: item.date,
            summary: '[RESTAURAÇÃO AUTOMÁTICA] Visita recuperada após erro no sistema.'
        }).select().single();

        if (vError) {
            console.error(`❌ Erro ao criar visita para ${item.name}:`, vError.message);
            continue;
        }
        console.log(`✅ Visita criada: ${visit.id}`);

        // 3. Gerar Vouchers (3 por padrão para garantir retorno dos dados)
        const codes = [generateVoucherCode(), generateVoucherCode(), generateVoucherCode()];
        const voucherPayload = codes.map(code => ({
            code,
            academy_id: academy.id,
            event_id: item.eventId,
            visit_id: visit.id,
            created_at: item.date
        }));

        const { error: voError } = await supabase.from('vouchers').insert(voucherPayload);
        if (voError) {
            console.error(`❌ Erro ao criar vouchers para ${item.name}:`, voError.message);
        } else {
            console.log(`✅ 3 Vouchers gerados para ${item.name}: ${codes.join(', ')}`);
        }
    }

    console.log("\n✨ Processo de restauração concluído!");
}

restoreData();
