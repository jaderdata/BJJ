
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function capVisitDurations() {
    console.log('🛠️ Starting Retroactive Duration Cap (Max 1h)...');

    // 1. Fetch visits that are finished
    // We remove the strict status check 'VISITED' because the DB might use 'Visitada' or other case variants.
    // Relying on finished_at being present is safer for calculating duration.
    const { data: visits, error } = await supabase
        .from('visits')
        .select('id, started_at, finished_at, status, academies(name)')
        .not('finished_at', 'is', null);

    if (error) {
        console.error('Error fetching visits:', error);
        return;
    }

    console.log(`Checking ${visits?.length || 0} finished visits...`);

    let fixedCount = 0;

    for (const visit of visits) {
        if (!visit.started_at || !visit.finished_at) continue;

        const startedAt = new Date(visit.started_at);
        const finishedAt = new Date(visit.finished_at);

        // Duration in minutes
        const durationMin = Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000);

        // Threshold: 65 minutes (1h 5m)
        if (durationMin > 65) {
            const academyName = Array.isArray(visit.academies) ? visit.academies[0]?.name : (visit.academies as any)?.name;

            console.log(`\nFound long visit: ${visit.id}`);
            console.log(`   Academy: ${academyName || 'Unknown'}`);
            console.log(`   Status: ${visit.status}`);
            console.log(`   Current Duration: ${durationMin} min`);

            // New finished_at = started_at + 1 hour
            const newFinishedAt = new Date(startedAt.getTime() + 60 * 60000);

            console.log(`   Capping... New Finished At: ${newFinishedAt.toISOString()} (60 min)`);

            const { error: updateError } = await supabase
                .from('visits')
                .update({
                    finished_at: newFinishedAt.toISOString(),
                    status: 'Visitada' // Ensure it's marked as visited with correct enum string if it wasn't
                })
                .eq('id', visit.id);

            if (updateError) {
                console.error(`   ❌ Error updating visit ${visit.id}:`, updateError);
            } else {
                console.log(`   ✅ Fixed!`);
                fixedCount++;
            }
        }
    }

    console.log(`\n🎉 Process Complete. Capped ${fixedCount} visits.`);
}

capVisitDurations();
