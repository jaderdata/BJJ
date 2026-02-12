import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function checkVisitsTable() {
    const { data, error } = await supabase.from('visits').select('*').limit(1);
    if (!error && data.length > 0) {
        console.log("Visit columns:", Object.keys(data[0]));
        console.log("Sample visit:", data[0]);
    }
}
checkVisitsTable();
