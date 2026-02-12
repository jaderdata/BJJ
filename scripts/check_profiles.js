import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function checkProfiles() {
    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log("Profiles found:");
    profiles.forEach(p => console.log(`- ${p.email} | ID: ${p.id}`));
}
checkProfiles();
