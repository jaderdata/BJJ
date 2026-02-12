import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findUser() {
    const { data: users } = await supabase.from('app_users').select('*').eq('email', 'jaderdata@gmail.com');
    if (users && users.length > 0) {
        console.log("User Found:", users[0].id);
    } else {
        console.log("User not found in app_users.");
    }
}
findUser();
