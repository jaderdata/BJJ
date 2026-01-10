import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinanceStatuses() {
    console.log("Consultando status existentes na tabela finance_records...");

    const { data, error } = await supabase.from('finance_records').select('status');

    if (error) {
        console.error("Error:", error);
    } else {
        const statuses = [...new Set(data.map(e => e.status))];
        console.log("Status únicos encontrados no BD:", statuses);
    }
}

checkFinanceStatuses();
