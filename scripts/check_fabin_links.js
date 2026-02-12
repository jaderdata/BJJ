
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLinks() {
    const ids = [
        '9e741f9f-82a8-488e-9e12-067153f2d4e1',
        '115000fe-a728-4bdf-ab5b-8dc07f51a500'
    ];

    console.log("Checking event links for Fabin Rosa duplicates...");

    const { data, error } = await supabase
        .from('event_academies')
        .select('event_id, academy_id, is_active')
        .in('academy_id', ids);

    if (error) console.error("Error:", error);
    else console.log("Links found:", data);
}

checkLinks();
