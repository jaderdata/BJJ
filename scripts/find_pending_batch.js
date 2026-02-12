import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findPending() {
    const list = ["Mudita Jiu Jitsu", "Gracie Barra Kissimmee", "Guto Campos Brazilian Jiu-Jitsu"];
    const { data: visits } = await supabase.from('visits').select('*, academies(name)').in('academies.name', list);

    console.log("Visitas encontradas:");
    visits?.forEach(v => {
        console.log(`- ${v.academies.name} | Status: ${v.status} | ID: ${v.id}`);
    });

    // If not found in visits, search in academies directly
    if (!visits || visits.length < 3) {
        const { data: academies } = await supabase.from('academies').select('id, name').in('name', list);
        console.log("\nIDs de Academias:");
        academies?.forEach(a => console.log(`- ${a.name}: ${a.id}`));
    }
}
findPending();
