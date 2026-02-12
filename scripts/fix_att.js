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

async function fixATT() {
    const academyName = "American Top Team Kissimmee - Black Boxx";
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26';
    const date = "2026-02-06T22:01:00.637Z";

    const { data: academy } = await supabase.from('academies').select('id').eq('name', academyName).single();
    if (!academy) return;

    // Check if visit exists
    let { data: visit } = await supabase.from('visits').select('*').eq('academy_id', academy.id).eq('event_id', eventId).maybeSingle();

    const codes = [generateVoucherCode(), generateVoucherCode(), generateVoucherCode()];

    if (visit) {
        console.log("Visit found, updating status and vouchers...");
        await supabase.from('visits').update({
            status: 'Visitada',
            vouchers_generated: codes,
            summary: '[RESTAURADO] Voltando para a lista.'
        }).eq('id', visit.id);
    } else {
        console.log("Visit not found, creating new...");
        const { data: newV } = await supabase.from('visits').insert({
            academy_id: academy.id,
            event_id: eventId,
            status: 'Visitada',
            started_at: date,
            finished_at: date,
            summary: '[RESTAURADO] Voltando para a lista.',
            vouchers_generated: codes
        }).select().single();
        visit = newV;
    }

    // Add Vouchers
    const voucherPayload = codes.map(code => ({
        code,
        academy_id: academy.id,
        event_id: eventId,
        visit_id: visit.id,
        created_at: date
    }));
    await supabase.from('vouchers').insert(voucherPayload);

    console.log(`✅ ${academyName} restaurado! Codes: ${codes.join(', ')}`);
}
fixATT();
