-- FIX: REMOVE DUPLICATE VISITS (Keeping 'Visitada' or most recent)

DO $$ 
DECLARE
    r RECORD;
    v_keep_id UUID;
    v_duplicates_count INT := 0;
BEGIN
    RAISE NOTICE '🔍 Checking for duplicate visits...';

    FOR r IN 
        SELECT event_id, academy_id, COUNT(*) as count
        FROM visits
        GROUP BY event_id, academy_id
        HAVING COUNT(*) > 1
    LOOP
        -- Strategy:
        -- 1. Prefer visit with status 'Visitada' (VISITED)
        -- 2. If multiple 'Visitada', prefer the most recently updated/finished
        -- 3. If no 'Visitada', prefer the most recently updated
        
        SELECT id INTO v_keep_id
        FROM visits
        WHERE event_id = r.event_id AND academy_id = r.academy_id
        ORDER BY 
            CASE WHEN status = 'Visitada' THEN 1 ELSE 2 END ASC, -- Prioritize Visited
            COALESCE(finished_at, updated_at, created_at) DESC -- Then most recent
        LIMIT 1;
        
        RAISE NOTICE '👉 Found duplicates for Event % / Academy %. Keeping ID: %', r.event_id, r.academy_id, v_keep_id;

        -- Delete the others
        DELETE FROM visits 
        WHERE event_id = r.event_id 
          AND academy_id = r.academy_id 
          AND id != v_keep_id;
          
        v_duplicates_count := v_duplicates_count + (r.count - 1);
    END LOOP;

    RAISE NOTICE '✅ Cleanup complete. Removed % duplicate visits.', v_duplicates_count;
END $$;
