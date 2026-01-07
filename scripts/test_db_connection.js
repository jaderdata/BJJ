import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnectionAndPersistence() {
    console.log("1. Starting Database Persistence Test...");

    // 0. Authenticate
    const email = 'verifier.admin@bjjvisits.com';
    const password = 'StrongVerifierPassword123!';

    // Try sign up
    let { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        // If already registered, sign in
        if (authError.message.includes("already registered") || authError.status === 400) { // status 422 sometimes
            console.log("User exists, signing in...");
            const { data: { user: signedInUser }, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (signInError) {
                console.error("❌ Sign in failed:", signInError);
                return;
            }
            user = signedInUser;
        } else {
            console.error("❌ Auth failed:", authError);
            return;
        }
    }
    console.log("✅ Authenticated as:", user.email, user.id);

    // 1. Create Academy
    const academyPayload = {
        name: 'Test Academy ' + Date.now(),
        city: 'Test City',
        state: 'SP',
        address: 'Rua Teste 123',
        responsible: 'Tester',
        phone: '1199999999'
    };
    const { data: academy, error: acadError } = await supabase.from('academies').insert(academyPayload).select().single();
    if (acadError) {
        console.error("❌ Failed to create academy:", acadError);
        return;
    }
    console.log("✅ Academy created:", academy.name, `(${academy.id})`);

    // 2. Create Event (Assign to first available salesperson if any, or null)
    const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
    const salespersonId = profiles && profiles.length > 0 ? profiles[0].id : null;

    const eventPayload = {
        name: 'Test Event ' + Date.now(),
        city: 'Test City',
        state: 'SP',
        status: 'A acontecer',
        salesperson_id: salespersonId,
        event_date: new Date().toISOString()
    };
    const { data: event, error: eventError } = await supabase.from('events').insert(eventPayload).select().single();
    if (eventError) {
        console.error("❌ Failed to create event:", eventError);
        return;
    }
    console.log("✅ Event created:", event.name, `(${event.id})`);

    // 3. Link Academy to Event
    const { error: linkError } = await supabase.from('event_academies').insert({
        event_id: event.id,
        academy_id: academy.id
    });
    if (linkError) {
        console.error("❌ Failed to link academy:", linkError);
    } else {
        console.log("✅ Academy linked to Event");
    }

    // 4. Create Visit (Pending)
    const visitPayload = {
        event_id: event.id,
        academy_id: academy.id,
        salesperson_id: salespersonId,
        status: 'Pendente',
        created_at: new Date().toISOString()
    };
    // Note: RLS might block if not logged in or if logic requires specific user. 
    // Since we are using anon key, we are "anon". RLS must allow insert. 
    // If RLS is strict, this might fail unless we sign in.
    // Assuming RLS allows anon insert for testing or we adjusted it.
    // Actually, earlier RLS setup might restrict upgrades. Let's see.

    const { data: visit, error: visitError } = await supabase.from('visits').insert(visitPayload).select().single();
    if (visitError) {
        console.error("❌ Failed to create visit:", visitError);
    } else {
        console.log("✅ Visit created:", visit.id);
    }

    // 5. Create Finance Record
    const financePayload = {
        event_id: event.id,
        salesperson_id: salespersonId,
        amount: 150.50,
        status: 'Pendente',
        updated_at: new Date().toISOString()
    };
    const { data: finance, error: financeError } = await supabase.from('finance_records').insert(financePayload).select().single();
    if (financeError) {
        console.error("❌ Failed to create finance record:", financeError);
    } else {
        console.log("✅ Finance Record created:", finance.id);
    }

    console.log("\n--- VERIFICATION SUMMARY ---");
    console.log("Querying database to confirm...");

    const { data: eventsFound } = await supabase.from('events').select('*').eq('id', event.id);
    console.log(`Events found: ${eventsFound?.length}`);

    const { data: academiesFound } = await supabase.from('academies').select('*').eq('id', academy.id);
    console.log(`Academies found: ${academiesFound?.length}`);

    const { data: financeFound } = await supabase.from('finance_records').select('*').eq('id', finance.id);
    console.log(`Finance Records found: ${financeFound?.length}`);

    if (visit) {
        const { data: visitsFound } = await supabase.from('visits').select('*').eq('id', visit.id);
        console.log(`Visits found: ${visitsFound?.length}`);
    }

    console.log("Test Complete.");
}

testConnectionAndPersistence();
