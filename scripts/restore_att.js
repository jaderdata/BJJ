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

async function restoreATT() {
    const academyName = "American Top Team Kissimmee - Black Boxx";
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26';
    const salespersonId = '340ffcb3-7671-41e7-9bb9-675208d905fa';
    const date = "2026-02-06T22:01:00.637Z";

    console.log(`🚀 Restaurando ${academyName}...`);

    // 1. Achar Academia
    const { data: academy } = await supabase.from('academies').select('id').eq('name', academyName).single();
    if (!academy) {
        console.error("❌ Academia não encontrada.");
        return;
    }

    // 2. Criar Visita
    const { data: visit, error: vError } = await supabase.from('visits').insert({
        academy_id: academy.id,
        event_id: eventId,
        salesperson_id: salespersonId,
        status: 'Visitada',
        started_at: date,
        finished_at: date,
        summary: '[RESTAURAÇÃO FINAL] Reativando conforme solicitado.'
    }).select().single();

    if (vError) {
        console.error("❌ Erro ao criar visita:", vError.message);
        return;
    }

    // 3. Gerar Vouchers
    const codes = [generateVoucherCode(), generateVoucherCode(), generateVoucherCode()];
    const voucherPayload = codes.map(code => ({
        code,
        academy_id: academy.id,
        event_id: eventId,
        visit_id: visit.id,
        created_at: date
    }));

    await supabase.from('vouchers').insert(voucherPayload);

    // 4. Sincronizar array na visita (para visualização imediata)
    await supabase.from('visits').update({ vouchers_generated: codes }).eq('id', visit.id);

    console.log(`✅ Restaurado com sucesso! Vouchers: ${codes.join(', ')}`);
}

restoreATT();
