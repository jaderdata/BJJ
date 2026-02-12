
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
// Using the key found in test_db_connection.js
const supabaseKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

async function audit() {
    console.log("🔍 Starting Database Integrity Audit...");

    // 1. Fetch Reference Data
    console.log("Fetching reference data...");

    // Events
    const { data: events, error: errEvents } = await supabase.from('events').select('id');
    if (errEvents) { console.error("Error fetching events:", errEvents); return; }
    const eventIds = new Set(events.map(e => e.id));
    console.log(`✅ Loaded ${events.length} events.`);

    // Academies
    const { data: academies, error: errAcademies } = await supabase.from('academies').select('id');
    if (errAcademies) { console.error("Error fetching academies:", errAcademies); return; }
    const academyIds = new Set(academies.map(a => a.id));
    console.log(`✅ Loaded ${academies.length} academies.`);

    // Users (salespersons)
    // Note: 'app_users' might not be readable if RLS is strict, but let's try.
    // DatabaseService uses 'app_users', so should be accessible.
    const { data: users, error: errUsers } = await supabase.from('app_users').select('id');
    let userIds = new Set();
    if (errUsers) {
        console.warn("⚠️ Could not fetch app_users (RLS?):", errUsers.message);
    } else {
        userIds = new Set(users.map(u => u.id));
        console.log(`✅ Loaded ${users.length} users.`);
    }

    // 2. Fetch Visits
    console.log("Fetching visits...");
    const { data: visits, error: errVisits } = await supabase.from('visits').select('id, event_id, academy_id, salesperson_id, created_at');
    if (errVisits) { console.error("Error fetching visits:", errVisits); return; }
    console.log(`✅ Loaded ${visits.length} visits. Analyzing...`);

    const orphans = [];
    const duplicates = [];
    const visitMap = new Map(); // key: event_id:academy_id -> [visit]

    for (const v of visits) {
        const issues = [];

        // Check Event Orphan
        if (!eventIds.has(v.event_id)) {
            issues.push(`Orphan: Event ID ${v.event_id} not found`);
        }

        // Check Academy Orphan
        if (!academyIds.has(v.academy_id)) {
            issues.push(`Orphan: Academy ID ${v.academy_id} not found`);
        }

        // Check User Orphan
        if (v.salesperson_id && userIds.size > 0 && !userIds.has(v.salesperson_id)) {
            // Optional: might be soft deleted or in auth.users?
            // issues.push(`Warning: Salesperson ID ${v.salesperson_id} not found in app_users`);
        }

        if (issues.length > 0) {
            orphans.push({ id: v.id, issues });
        }

        // Check Duplicates
        if (v.event_id && v.academy_id) {
            const key = `${v.event_id}:${v.academy_id}`;
            if (visitMap.has(key)) {
                visitMap.get(key).push(v);
            } else {
                visitMap.set(key, [v]);
            }
        }
    }

    // Identify duplicates groups
    for (const [key, group] of visitMap) {
        if (group.length > 1) {
            duplicates.push({ key, count: group.length, ids: group.map(g => g.id) });
        }
    }

    // 3. Report
    console.log("\n📊 AUDIT REPORT:");
    console.log("----------------");

    if (orphans.length === 0) {
        console.log("✅ No orphan visits found.");
    } else {
        console.log(`❌ Found ${orphans.length} orphan visits (referencing missing event/academy):`);
        orphans.forEach(o => console.log(`   - Visit ${o.id}: ${o.issues.join(', ')}`));
    }

    if (duplicates.length === 0) {
        console.log("✅ No duplicate visits found (same Event + Academy).");
    } else {
        console.log(`❌ Found ${duplicates.length} sets of duplicate visits:`);
        duplicates.forEach(d => console.log(`   - Event:Academy ${d.key}: ${d.count} visits (${d.ids.join(', ')})`));
    }

    // 4. Check Event-Academy Junction Integrity
    // Check if event_academies table has orphans
    console.log("\nChecking event_academies junction table...");
    const { data: junctions, error: errJunc } = await supabase.from('event_academies').select('event_id, academy_id');
    if (!errJunc) {
        let junctionOrphans = 0;
        junctions.forEach(j => {
            if (!eventIds.has(j.event_id) || !academyIds.has(j.academy_id)) {
                junctionOrphans++;
            }
        });
        if (junctionOrphans > 0) console.log(`❌ Found ${junctionOrphans} orphan records in event_academies.`);
        else console.log("✅ event_academies table consistency check passed.");
    } else {
        console.warn("Could not check event_academies:", errJunc.message);
    }



    // 5. Check Vouchers Integrity
    console.log("\nChecking Vouchers table...");
    const { data: vouchers, error: errVouchers } = await supabase.from('vouchers').select('code, visit_id, event_id, academy_id');
    if (errVouchers) {
        console.error("Error fetching vouchers:", errVouchers);
    } else {
        const visitIds = new Set(visits.map(v => v.id));
        let voucherOrphans = 0;
        let voucherEventMismatch = 0;

        vouchers.forEach(vc => {
            // Check Visit Link
            if (vc.visit_id && !visitIds.has(vc.visit_id)) {
                voucherOrphans++;
                console.log(`❌ Voucher ${vc.code} points to non-existent visit ${vc.visit_id}`);
            }

            // Check Event/Academy consistency
            if (vc.visit_id && visitIds.has(vc.visit_id)) {
                const parentVisit = visits.find(v => v.id === vc.visit_id);
                if (parentVisit) {
                    if (vc.event_id && vc.event_id !== parentVisit.event_id) {
                        voucherEventMismatch++;
                        console.log(`⚠️ Voucher ${vc.code} event_id (${vc.event_id}) mismatches Visit event_id (${parentVisit.event_id})`);
                    }
                }
            }
        });

        if (voucherOrphans === 0 && voucherEventMismatch === 0) {
            console.log("✅ Vouchers table integrity check passed.");
        } else {
            console.log(`❌ Found ${voucherOrphans} orphan vouchers and ${voucherEventMismatch} mismatches.`);
        }
    }



    console.log("\nAudit Complete.");
}

audit();
