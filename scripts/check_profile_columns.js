import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function checkProfileColumns() {
    const { data } = await supabase.from('profiles').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Colunas em profiles:", Object.keys(data[0]));
        console.log("Exemplo de dados:", data[0]);
    }
}
checkProfileColumns();
