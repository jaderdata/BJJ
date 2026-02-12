import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findLatestBatch() {
    const list = ["Mudita Jiu Jitsu", "Gracie Barra Kissimmee", "Guto Campos Brazilian Jiu-Jitsu"];
    console.log("Buscando registros para a nova lista...");

    for (const name of list) {
        const { data: notification } = await supabase.from('notifications')
            .select('*')
            .ilike('message', `%${name}%`)
            .order('created_at', { ascending: false })
            .limit(1);

        if (notification && notification.length > 0) {
            console.log(`\nFound: ${name}`);
            console.log(`Message: ${notification[0].message}`);
            console.log(`Date: ${notification[0].created_at}`);
        } else {
            console.log(`\nNot found: ${name} (Usando data padrão de hoje se necessário)`);
        }
    }
}
findLatestBatch();
