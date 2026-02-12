import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

async function exploreTables() {
    // Try to query common table names to see what exists
    const tables = ['visits', 'vouchers', 'academies', 'events', 'notifications', 'profiles', 'finance_records', 'event_academies', 'audit_log', 'history'];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
            console.log(`Table '${table}' exists and has ${count} records.`);
        }
    }
}
exploreTables();
