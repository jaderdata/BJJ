
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreate() {
    console.log("Intentando crear evento con status 'Upcoming'...");

    const payload = {
        name: 'Test Event Debug Status',
        city: 'Debug City',
        state: 'SP',
        // address: undefined, 
        status: 'Upcoming',
        event_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase.from('events').insert(payload).select();

    if (error) {
        console.error("Error con 'Upcoming':", error.message);

        // Try Next Option
        console.log("Intentando con 'A acontecer'...");
        payload.status = 'A acontecer';
        const { error: error2 } = await supabase.from('events').insert(payload).select();
        if (error2) console.error("Error con 'A acontecer':", error2.message);
        else console.log("Éxito con 'A acontecer'");

        // Try UPCOMING
        console.log("Intentando con 'UPCOMING'...");
        payload.status = 'UPCOMING';
        const { error: error3 } = await supabase.from('events').insert(payload).select();
        if (error3) console.error("Error con 'UPCOMING':", error3.message);
        else console.log("Éxito con 'UPCOMING'");

    } else {
        console.log("Evento creado exitosamente con 'Upcoming':", data);
        if (data && data[0]) await supabase.from('events').delete().eq('id', data[0].id);
    }
}

testCreate();
