-- CHECK EVENTS AND VISITS DIAGNOSIS
-- Vamos certificar qual evento está sendo usado e quais eventos existem.

DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- EVENTS ---';
    FOR r IN SELECT id, name, created_at FROM events ORDER BY created_at DESC LIMIT 5 LOOP
        RAISE NOTICE 'Event: % | ID: % | Created: %', r.name, r.id, r.created_at;
    END LOOP;

    RAISE NOTICE '--- MUDITA VISITS ---';
    FOR r IN 
        SELECT v.id, v.status, v.event_id, e.name as event_name, a.name as academy_name
        FROM visits v 
        JOIN academies a ON v.academy_id = a.id
        LEFT JOIN events e ON v.event_id = e.id
        WHERE a.name ILIKE '%Mudita%'
    LOOP
        RAISE NOTICE 'Visit: % | Status: % | Event: % (%)', r.id, r.status, r.event_name, r.event_id;
    END LOOP;

     RAISE NOTICE '--- GRACIE BARRA VISITS ---';
    FOR r IN 
        SELECT v.id, v.status, v.event_id, e.name as event_name, a.name as academy_name
        FROM visits v 
        JOIN academies a ON v.academy_id = a.id
        LEFT JOIN events e ON v.event_id = e.id
        WHERE a.name ILIKE '%Gracie Barra%Kissimmee%'
    LOOP
        RAISE NOTICE 'Visit: % | Status: % | Event: % (%)', r.id, r.status, r.event_name, r.event_id;
    END LOOP;

END $$;
