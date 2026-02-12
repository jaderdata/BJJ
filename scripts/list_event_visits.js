import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function listAllInEvent() {
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26';
    const { data: visits } = await supabase.from('visits').select('id, academy_id, academies(name)').eq('event_id', eventId);

    console.log(`📋 Todas as visitas no evento (${visits?.length || 0}):`);
    visits?.forEach(v => console.log(`- ${v.academies?.name} (ID: ${v.id})`));
}
listAllInEvent();
