import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function listAllAcademies() {
    const { data } = await supabase.from('academies').select('name');
    console.log("Nomes de Academias no Banco:");
    data.forEach(a => {
        if (a.name.includes('Gracie') || a.name.includes('Orlando') || a.name.includes('Fabin') || a.name.includes('Elementum')) {
            console.log(`- "${a.name}"`);
        }
    });
}
listAllAcademies();
