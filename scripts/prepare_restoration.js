import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function prepareRestoration() {
    const targetAcademies = [
        "American Top Team Kissimmee - Black Boxx",
        "Asenjo Brazilian Jiu-Jitsu",
        "Jorge Pereira Jiu Jitsu South Beach Miami",
        "Gracie Barra Monticello",
        "GABRIELA BJJ"
    ];

    console.log("Preparando dados para restauração...");

    const results = [];

    for (const name of targetAcademies) {
        // 1. Find Academy
        const { data: academy } = await supabase.from('academies').select('id, name').eq('name', name).single();
        if (!academy) {
            console.error(`Academia não encontrada: ${name}`);
            continue;
        }

        // 2. Find Event Association
        const { data: junction } = await supabase.from('event_academies').select('event_id').eq('academy_id', academy.id).limit(1);
        const eventId = junction && junction.length > 0 ? junction[0].event_id : null;

        // 3. Find Salesperson (from notification)
        const { data: notification } = await supabase.from('notifications').select('message, created_at').ilike('message', `%${name}%`).order('created_at', { ascending: false }).limit(1);

        let salespersonId = null;
        if (notification && notification.length > 0) {
            const emailMatch = notification[0].message.match(/vendedor (.*) concluiu/);
            const email = emailMatch ? emailMatch[1].trim() : null;
            if (email) {
                const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
                salespersonId = profile ? profile.id : null;
            }
        }

        results.push({
            name: academy.name,
            academyId: academy.id,
            eventId: eventId,
            salespersonId: salespersonId,
            finishedAt: notification && notification.length > 0 ? notification[0].created_at : null
        });
    }

    console.log("\n--- DADOS PARA RESTAURAÇÃO ---");
    console.log(JSON.stringify(results, null, 2));
}

prepareRestoration();
