
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreate() {
    console.log("TEST 1: Insertar sin address...");

    let payload = {
        name: 'Test Event No Address',
        city: 'Debug City',
        state: 'SP',
        // address omitido
        status: 'A acontecer',
        event_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    };

    let { data, error } = await supabase.from('events').insert(payload).select();

    if (error) {
        console.error("FALLO SIN ADDRESS:", error);
    } else {
        console.log("EXITO SIN ADDRESS");
        if (data[0]) await supabase.from('events').delete().eq('id', data[0].id);
    }

    console.log("TEST 2: Insertar con address explicito NULL...");
    payload = {
        name: 'Test Event Null Address',
        city: 'Debug City',
        state: 'SP',
        address: null,
        status: 'A acontecer',
        event_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    };

    ({ data, error } = await supabase.from('events').insert(payload).select());

    if (error) {
        console.error("FALLO CON ADDRESS NULL:", error);
    } else {
        console.log("EXITO CON ADDRESS NULL");
        if (data[0]) await supabase.from('events').delete().eq('id', data[0].id);
    }

    console.log("TEST 3: Insertar salesperson_id NULL...");
    payload = {
        name: 'Test Event Null Salesperson',
        city: 'Debug City',
        state: 'SP',
        address: 'Some Address',
        status: 'A acontecer',
        salesperson_id: null,
        event_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    };
    ({ data, error } = await supabase.from('events').insert(payload).select());

    if (error) {
        console.error("FALLO CON SALESPERSON NULL:", error);
    } else {
        console.log("EXITO CON SALESPERSON NULL");
        if (data[0]) await supabase.from('events').delete().eq('id', data[0].id);
    }
}

testCreate();
