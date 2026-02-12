
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSquad() {
    const squadId = '322fae77-67fd-4bf3-8eb6-6eacf778e2f3';

    console.log("Checking SQUAD links...");
    const { data: links } = await supabase
        .from('event_academies')
        .select('*')
        .eq('academy_id', squadId);

    console.log("SQUAD Links:", links);

    // Get Event Name
    if (links && links.length > 0) {
        const { data: event } = await supabase
            .from('events')
            .select('name')
            .eq('id', links[0].event_id)
            .single();
        console.log("Event:", event);
    }
}

checkSquad();
