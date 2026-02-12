import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findTestAcademy() {
    const { data: visits } = await supabase.from('visits').select('*, academies(name), events(name)').ilike('academies.name', '%Test%');
    console.log("🔍 Visitas de Teste encontradas everywhere:");
    visits?.forEach(v => console.log(`- Academy: ${v.academies?.name} | Event: ${v.events?.name} | Event ID: ${v.event_id}`));
}
findTestAcademy();
