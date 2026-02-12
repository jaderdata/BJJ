import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function check() {
    const { data: visits } = await supabase.from('visits').select('*, academies(name)');
    console.log("Visitas Atuais:");
    visits.forEach(v => console.log(`- ${v.academies?.name} (Status: ${v.status})`));
}
check();
