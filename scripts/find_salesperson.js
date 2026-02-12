import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findSalesperson() {
    const { data: visits } = await supabase.from('visits').select('salesperson_id').limit(1);
    if (visits && visits.length > 0) {
        console.log("Salesperson ID found:", visits[0].salesperson_id);
    }
}
findSalesperson();
