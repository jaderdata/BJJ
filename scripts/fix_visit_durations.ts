
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDurations() {
    console.log('🛠️ Starting Duration Fix...');

    // 1. Fetch visits with suspicious duration (approx 24h = 1440 min)
    // We'll look for visits started since yesterday to be safe
    const { data: visits, error } = await supabase
        .from('visits')
        .select('*')
        .gte('started_at', '2026-02-11T00:00:00')
        .not('finished_at', 'is', null);

    if (error) {
        console.error('Error fetching visits:', error);
        return;
    }

    let fixedCount = 0;

    for (const visit of visits) {
        const startedAt = new Date(visit.started_at);
        const finishedAt = new Date(visit.finished_at);

        const durationMin = Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000);

        // Check if duration is suspiciously close to 24h (1440 min)
        // allowing some buffer, e.g. > 1400 min
        if (durationMin >= 1400) {
            console.log(`\nFound suspicious visit: ${visit.id}`);
            console.log(`   Academy ID: ${visit.academy_id}`);
            console.log(`   Current Duration: ${durationMin} min`);

            // Calculate new start time: finished_at - 30 minutes
            const newStartedAt = new Date(finishedAt.getTime() - 30 * 60000);

            console.log(`   Fixing... New Start Time: ${newStartedAt.toISOString()}`);

            const { error: updateError } = await supabase
                .from('visits')
                .update({ started_at: newStartedAt.toISOString() })
                .eq('id', visit.id);

            if (updateError) {
                console.error(`   ❌ Error updating visit ${visit.id}:`, updateError);
            } else {
                console.log(`   ✅ Fixed!`);
                fixedCount++;
            }
        }
    }

    console.log(`\n🎉 Process Complete. Fixed ${fixedCount} visits.`);
}

fixDurations();
