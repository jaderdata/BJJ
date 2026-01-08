
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreate() {
    console.log("Intentando crear evento sin address...");
    
    const payload = {
        name: 'Test Event Debug ' + Date.now(),
        city: 'Debug City',
        state: 'SP',
        // address: undefined, // Simular falta de address
        status: 'UPCOMING', // Usar valor válido del enum si aplica
        event_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    };

    console.log("Payload:", payload);

    const { data, error } = await supabase.from('events').insert(payload).select();

    if (error) {
        console.error("Error capturado:", error);
    } else {
        console.log("Evento creado exitosamente:", data);
        // Limpiar
        if (data && data[0]) {
             await supabase.from('events').delete().eq('id', data[0].id);
             console.log("Evento de prueba eliminado.");
        }
    }
}

testCreate();
