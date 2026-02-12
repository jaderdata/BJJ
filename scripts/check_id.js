import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function checkId() {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', '340ffcb3-7671-41e7-9bb9-675208d905fa').single();
    if (profile) {
        console.log("Profile:", profile.name);
    } else {
        console.log("Profile not found in profiles table.");
    }
}
checkId();
