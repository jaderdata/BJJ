import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findTestAcademies() {
    const { data: academies } = await supabase.from('academies').select('name, id').or('name.ilike.%test%,name.ilike.%teste%');
    console.log("🏫 Academias de Teste no Banco:");
    academies?.forEach(a => console.log(`- "${a.name}" | ID: ${a.id}`));
}
findTestAcademies();
