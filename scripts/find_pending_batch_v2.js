import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findPending() {
    const list = ["Mudita Jiu Jitsu", "Gracie Barra Kissimmee", "Guto Campos Brazilian Jiu-Jitsu"];
    console.log("Buscando academias...");

    const { data: academies } = await supabase.from('academies').select('id, name').in('name', list);

    if (!academies || academies.length === 0) {
        console.log("Nenhuma academia encontrada com esses nomes exatos.");
        // Tentar busca parcial
        console.log("Tentando busca parcial...");
        const { data: partial } = await supabase.from('academies').select('id, name').or(list.map(n => `name.ilike.%${n}%`).join(','));
        console.log("Resultados parciais:", partial);
        return;
    }

    console.log("Academias encontradas:", academies);
    const ids = academies.map(a => a.id);

    const { data: visits } = await supabase.from('visits').select('*').in('academy_id', ids);
    console.log("Visitas associadas:", visits);
}
findPending();
