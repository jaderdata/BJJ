
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchVisits() {
    console.log('Fetching visits...');

    // Search for visits around the dates mentioned: 2026-02-11 and 2026-02-12
    const { data: visits, error } = await supabase
        .from('visits')
        .select(`
      *,
      academies (name),
      events (name)
    `)
        .gte('started_at', '2026-02-11T00:00:00')
        .lte('started_at', '2026-02-13T23:59:59')
        .order('started_at', { ascending: false });

    if (error) {
        console.error('Error fetching visits:', error);
        return;
    }

    console.log(`Found ${visits.length} visits.`);

    for (const visit of visits) {
        const startedAt = new Date(visit.started_at);
        const finishedAt = visit.finished_at ? new Date(visit.finished_at) : null;
        let durationMin = 0;

        if (finishedAt) {
            durationMin = Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000);
        }

        console.log('--------------------------------------------------');
        console.log(`ID: ${visit.id}`);
        console.log(`Academy: ${visit.academies?.name}`);
        console.log(`Event: ${visit.events?.name}`);
        console.log(`Started At (Raw): ${visit.started_at}`);
        console.log(`Finished At (Raw): ${visit.finished_at}`);
        console.log(`Duration (Calc): ${durationMin} min`);

        // Check for exactly 1440 (24h)
        if (durationMin >= 1400) {
            console.warn('⚠️  SUSPICIOUS DURATION DETECTED!');
        }
    }
}

fetchVisits();
