
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function recoverVisits() {
    console.log("🛠️ Starting Manual Recovery for SQUAD & Fabin Rosa...");

    // 0. Authenticate
    const email = 'verifier.admin@bjjvisits.com';
    const password = 'StrongVerifierPassword123!';
    await supabase.auth.signInWithPassword({ email, password });

    // Data to Recover
    const targets = [
        {
            nameMask: 'SQUAD',
            vouchers: ['GJR624', 'NTO866']
        },
        {
            nameMask: 'Fabin Rosa',
            vouchers: ['XIV711', 'VSJ660', 'GUA135']
        }
    ];

    // Event ID (Known from previous checks)
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26';

    for (const target of targets) {
        console.log(`\n👉 Processing ${target.nameMask}...`);

        // 1. Find Correct Academy ID (Linked to Event)
        const { data: links, error: linkError } = await supabase
            .from('event_academies')
            .select('academy_id, academies(name)')
            .eq('event_id', eventId)
            .ilike('academies.name', `%${target.nameMask}%`);

        // Supabase join query structure might be tricky, let's do two steps to be safe if join fails
        // Step 1: Find academies matching name
        const { data: academies } = await supabase.from('academies').select('id, name').ilike('name', `%${target.nameMask}%`);

        let academyId = null;

        // Step 2: Check which one is linked
        for (const a of academies) {
            const { data: link } = await supabase
                .from('event_academies')
                .select('*')
                .eq('event_id', eventId)
                .eq('academy_id', a.id)
                .eq('is_active', true);

            if (link && link.length > 0) {
                academyId = a.id;
                console.log(`   ✅ Found active academy: ${a.name} (${a.id})`);
                break;
            }
        }

        if (!academyId) {
            console.error(`   ❌ Could not find linked academy for ${target.nameMask}`);
            continue;
        }

        // 2. Check/Create Visit
        const { data: visit, error: visitError } = await supabase
            .from('visits')
            .upsert({
                event_id: eventId,
                academy_id: academyId,
                status: 'Visitada',
                started_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                finished_at: new Date().toISOString(),
                summary: 'Recuperação Manual de Dados Perdidos',
                vouchers_generated: target.vouchers,
                contact_person: 'Proprietário', // Default fallback
                temperature: 'Morno', // Correct Enum Value
                updated_at: new Date().toISOString()
            }, { onConflict: 'event_id, academy_id' })
            .select()
            .single();

        if (visitError) {
            console.error("   ❌ Error saving visit:", visitError);
            continue;
        }
        console.log(`   ✅ Visit saved! ID: ${visit.id}`);

        // 3. Create Vouchers
        for (const code of target.vouchers) {
            const { error: voucherError } = await supabase
                .from('vouchers')
                .upsert({
                    code: code,
                    event_id: eventId,
                    academy_id: academyId,
                    visit_id: visit.id,
                    created_at: new Date().toISOString()
                }, { onConflict: 'code' });

            if (voucherError) console.error(`      ❌ Error saving voucher ${code}:`, voucherError);
            else console.log(`      ✅ Voucher ${code} saved.`);
        }
    }

    console.log("\n🎉 Recovery Complete!");
}

recoverVisits();
