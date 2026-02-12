import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function findVoucherNotifications() {
    const { data: notifications } = await supabase.from('notifications').select('*').ilike('message', '%voucher%');
    console.log(`Encontradas ${notifications.length} notificações com a palavra 'voucher'.`);
    notifications.forEach(n => console.log(`- ${n.message}`));
}
findVoucherNotifications();
