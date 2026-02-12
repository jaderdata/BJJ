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

async function restoreBatch2() {
    const salespersonId = '340ffcb3-7671-41e7-9bb9-675208d905fa'; // jaderdata@gmail.com
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26';
    const targetAcademies = [
        "Mudita Jiu Jitsu",
        "Gracie Barra Kissimmee",
        "Guto Campos Brazilian Jiu-Jitsu"
    ];

    const now = new Date().toISOString();

    console.log("🚀 Iniciando restauração do segundo lote...");

    for (const name of targetAcademies) {
        console.log(`\nRestaurando: ${name}...`);

        // 1. Buscar ID da academia
        const { data: academy } = await supabase.from('academies').select('id').eq('name', name).single();
        if (!academy) {
            console.error(`❌ Academia não encontrada: ${name}`);
            continue;
        }

        // 2. Criar Visita
        const { data: visit, error: vError } = await supabase.from('visits').insert({
            academy_id: academy.id,
            event_id: eventId,
            salesperson_id: salespersonId,
            status: 'Visitada',
            started_at: now,
            finished_at: now,
            summary: '[RESTAURAÇÃO MANUAL] Visita recuperada conforme solicitação.'
        }).select().single();

        if (vError) {
            console.error(`❌ Erro ao criar visita para ${name}:`, vError.message);
            continue;
        }
        console.log(`✅ Visita criada: ${visit.id}`);

        // 3. Gerar Vouchers
        const codes = [generateVoucherCode(), generateVoucherCode(), generateVoucherCode()];
        const voucherPayload = codes.map(code => ({
            code,
            academy_id: academy.id,
            event_id: eventId,
            visit_id: visit.id,
            created_at: now
        }));

        const { error: voError } = await supabase.from('vouchers').insert(voucherPayload);
        if (voError) {
            console.error(`❌ Erro ao criar vouchers para ${name}:`, voError.message);
        } else {
            console.log(`✅ 3 Vouchers gerados: ${codes.join(', ')}`);
        }
    }

    console.log("\n✨ Restauração do segundo lote concluída!");
}

restoreBatch2();
