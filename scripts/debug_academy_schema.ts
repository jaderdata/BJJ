
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAcademy() {
    console.log('Inspecting academies table...');

    const { data: academies, error } = await supabase
        .from('academies')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching academy:', error);
        return;
    }

    if (academies && academies.length > 0) {
        console.log('Academy columns found:', Object.keys(academies[0]));
        console.log('First academy sample:', academies[0]);
    } else {
        console.log('No academies found to inspect.');
    }

    // Also try to find the specific academy
    const { data: specific, error: specificError } = await supabase
        .from('academies')
        .select('*')
        .ilike('name', '%Gracie Barra Kissimmee%');

    if (specificError) {
        console.error('Error fetching specific academy:', specificError);
    } else {
        console.log('Specific Academy found:', specific);
    }
}

inspectAcademy();
