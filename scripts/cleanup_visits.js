
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupDuplicates() {
    console.log("🔍 Starting Duplicate Cleanup...");

    // 0. Authenticate (using same creds as test script to ensure RLS access)
    const email = 'verifier.admin@bjjvisits.com';
    const password = 'StrongVerifierPassword123!';

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error("❌ Auth failed:", authError.message);
        return;
    }
    console.log("✅ Authenticated as:", user.email);

    // 1. Fetch all visits
    // We need to fetch enough data to group. 
    // If the dataset is huge, this might be slow, but for this bug it's likely manageable.
    const { data: visits, error } = await supabase
        .from('visits')
        .select('id, event_id, academy_id, status, created_at, finished_at, updated_at');

    if (error) {
        console.error("❌ Failed to fetch visits:", error);
        return;
    }

    console.log(`📦 Fetched ${visits.length} visits.`);

    // 2. Group by Event+Academy
    const groups = {};
    visits.forEach(v => {
        const key = `${v.event_id}-${v.academy_id}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(v);
    });

    // 3. Identify Duplicates
    const idsToDelete = [];
    let duplicateGroupsFound = 0;

    for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            duplicateGroupsFound++;
            console.log(`⚠️ Found duplicate group: ${key} (${group.length} visits)`);

            // Sort logic: 
            // 1. Valid 'Visitada' comes first
            // 2. Most recent finished/updated/created comes first
            group.sort((a, b) => {
                const aVisited = a.status === 'Visitada' ? 1 : 0;
                const bVisited = b.status === 'Visitada' ? 1 : 0;

                if (aVisited !== bVisited) return bVisited - aVisited; // Descending (1 first)

                const aTime = new Date(a.finished_at || a.updated_at || a.created_at).getTime();
                const bTime = new Date(b.finished_at || b.updated_at || b.created_at).getTime();

                return bTime - aTime; // Descending (newest first)
            });

            // Keep the first one (index 0), delete the rest
            const toDelete = group.slice(1);
            toDelete.forEach(v => {
                console.log(`   🗑️ Marking for deletion: ${v.id} (Status: ${v.status}, Created: ${v.created_at})`);
                idsToDelete.push(v.id);
            });
        }
    }

    if (idsToDelete.length === 0) {
        console.log("✅ No duplicates found.");
        return;
    }

    console.log(`🔥 Deleting ${idsToDelete.length} duplicate visits...`);

    // 4. Delete
    const { error: deleteError } = await supabase
        .from('visits')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error("❌ Failed to delete visits:", deleteError);
    } else {
        console.log("✅ Cleanup successful!");
        console.log(`   Removed ${idsToDelete.length} records from ${duplicateGroupsFound} groups.`);
    }
}

cleanupDuplicates();
