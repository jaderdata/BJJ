-- FIX: RECOVER LOST VISITS AND ASSOCIATE WITH CORRECT EVENT
-- This script will:
-- 1. Find the specific event "PBJJF ORLANDO SPRING INTERNATIONAL OPEN 2026"
-- 2. Ensure visits for Mudita and Gracie Barra are linked to it.
-- 3. Update status to 'Visitada'.

DO $$ 
DECLARE
    v_target_event_id UUID;
    v_mudita_id UUID;
    v_gracie_id UUID;
    v_visit_mudita_id UUID;
    v_visit_gracie_id UUID;
    
    v_status_visited TEXT := 'Visitada';
    v_mudita_vouchers TEXT[] := ARRAY['VRJ103', 'PSX622'];
    v_gracie_vouchers TEXT[] := ARRAY['NCF993', 'VVZ323', 'DZR462'];
    v_code TEXT;

BEGIN
    -- 1. Get Target Event
    -- Try exact name first, then fallback to partial match
    SELECT id INTO v_target_event_id FROM events WHERE name = 'PBJJF ORLANDO SPRING INTERNATIONAL OPEN 2026';
    
    IF v_target_event_id IS NULL THEN
        SELECT id INTO v_target_event_id FROM events WHERE name ILIKE '%PBJJF%SPRING%2026%' LIMIT 1;
    END IF;

    IF v_target_event_id IS NULL THEN
        RAISE EXCEPTION '❌ Evento "PBJJF ORLANDO SPRING INTERNATIONAL OPEN 2026" não encontrado!';
    ELSE
        RAISE NOTICE '✅ Alvo Evento Encontrado: %', v_target_event_id;
    END IF;

    -- 2. Get Academies
    SELECT id INTO v_mudita_id FROM academies WHERE name ILIKE '%Mudita%' LIMIT 1;
    
    SELECT id INTO v_gracie_id FROM academies WHERE name ILIKE '%Gracie Barra Kissimmee%' LIMIT 1;
    IF v_gracie_id IS NULL THEN
        SELECT id INTO v_gracie_id FROM academies WHERE name ILIKE '%Gracie Barra%' AND (city ILIKE '%Kissimmee%' OR address ILIKE '%Kissimmee%') LIMIT 1;
    END IF;

    -- 3. Ensure Mudita Visit is linked to THIS event
    IF v_mudita_id IS NOT NULL THEN
        -- Check if there is ANY visit for this academy (regardless of event) that we just created
        SELECT id INTO v_visit_mudita_id FROM visits WHERE academy_id = v_mudita_id ORDER BY created_at DESC LIMIT 1;

        IF v_visit_mudita_id IS NOT NULL THEN
            UPDATE visits 
            SET event_id = v_target_event_id, -- FORCE correct event
                status = v_status_visited,
                vouchers_generated = v_mudita_vouchers
            WHERE id = v_visit_mudita_id;
            RAISE NOTICE '✅ Mudita Visit MOVED to correct event: %', v_target_event_id;
        ELSE
            -- Create scratch if missing
            INSERT INTO visits (event_id, academy_id, status, started_at, finished_at, summary, vouchers_generated)
            VALUES (v_target_event_id, v_mudita_id, v_status_visited, NOW() - INTERVAL '1 day', NOW(), 'Manual recovery', v_mudita_vouchers)
            RETURNING id INTO v_visit_mudita_id;
             RAISE NOTICE '✅ Mudita Visit CREATED for correct event.';
        END IF;

        -- Update Vouchers to point to correct event too
        UPDATE vouchers SET event_id = v_target_event_id WHERE visit_id = v_visit_mudita_id;
    END IF;

    -- 4. Ensure Gracie Barra Visit is linked to THIS event
    IF v_gracie_id IS NOT NULL THEN
        SELECT id INTO v_visit_gracie_id FROM visits WHERE academy_id = v_gracie_id ORDER BY created_at DESC LIMIT 1;

        IF v_visit_gracie_id IS NOT NULL THEN
            UPDATE visits 
            SET event_id = v_target_event_id, -- FORCE correct event
                status = v_status_visited,
                vouchers_generated = v_gracie_vouchers
            WHERE id = v_visit_gracie_id;
            RAISE NOTICE '✅ Gracie Barra Visit MOVED to correct event: %', v_target_event_id;
        ELSE
            INSERT INTO visits (event_id, academy_id, status, started_at, finished_at, summary, vouchers_generated)
            VALUES (v_target_event_id, v_gracie_id, v_status_visited, NOW() - INTERVAL '1 day', NOW(), 'Manual recovery', v_gracie_vouchers)
            RETURNING id INTO v_visit_gracie_id;
            RAISE NOTICE '✅ Gracie Barra Visit CREATED for correct event.';
        END IF;

        -- Update Vouchers
        UPDATE vouchers SET event_id = v_target_event_id WHERE visit_id = v_visit_gracie_id;
    END IF;

END $$;
