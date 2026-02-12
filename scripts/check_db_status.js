import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabaseUrl = env.VITE_SUPABASE_URL.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStatusValues() {
    console.log("Checking visit status values in database...");
    const { data, error } = await supabase.from('visits').select('status').limit(10);

    if (error) {
        console.error("Error fetching visits:", error);
        return;
    }

    console.log("Found statuses:", [...new Set(data.map(v => v.status))]);
}

checkStatusValues();
