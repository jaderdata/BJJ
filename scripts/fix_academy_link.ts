
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAcademyLink() {
    console.log('Searching for Gracie Barra Kissimmee...');

    // 1. Find the Academy
    const { data: academies, error: acError } = await supabase
        .from('academies')
        .select('*')
        .ilike('name', '%Gracie Barra Kissimmee%');

    if (acError || !academies || academies.length === 0) {
        console.error('Academy not found or error:', acError);
        return;
    }

    const academy = academies[0];
    console.log(`Found academy: ${academy.name} (${academy.id})`);

    // 2. Find Visits for this Academy
    const { data: visits, error: vError } = await supabase
        .from('visits')
        .select('event_id, status')
        .eq('academy_id', academy.id);

    if (vError) {
        console.error('Error fetching visits:', vError);
        return;
    }

    if (!visits || visits.length === 0) {
        console.log('No visits found for this academy.');
        return;
    }

    console.log(`Found ${visits.length} visits for this academy.`);

    // 3. Link Academy to Events
    const eventIds = [...new Set(visits.map(v => v.event_id))];

    for (const eventId of eventIds) {
        const { data: event, error: eError } = await supabase
            .from('events')
            .select('name')
            .eq('id', eventId)
            .single();

        const eventName = event ? event.name : eventId;

        // Check if link exists in event_academies table
        const { data: existingLink, error: linkError } = await supabase
            .from('event_academies')
            .select('*')
            .eq('event_id', eventId)
            .eq('academy_id', academy.id)
            .maybeSingle();

        if (linkError) {
            console.error(`Error checking link for event ${eventName}:`, linkError);
            continue;
        }

        if (existingLink && existingLink.is_active) {
            console.log(`Academy is ALREADY linked to event: ${eventName}`);
        } else {
            console.log(`Academy is MISSING or INACTIVE in event: ${eventName}`);
            console.log('Fixing...');

            const { error: insertError } = await supabase
                .from('event_academies')
                .upsert({
                    event_id: eventId,
                    academy_id: academy.id,
                    is_active: true
                }, { onConflict: 'event_id,academy_id' });

            if (insertError) {
                console.error('Update failed:', insertError);
            } else {
                console.log('✅ Academy linked successfully!');
            }
        }
    }
}

fixAcademyLink();
