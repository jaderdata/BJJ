-- FIX: MANUALLY INSERT MISSING VISITS (REMOVED INVALID STATUS COLUMN FROM VOUCHERS)
-- Status column does not exist in vouchers table, removing it.

DO $$ 
DECLARE
    -- IDs
    v_mudita_id UUID;
    v_gracie_id UUID;
    v_visit_mudita_id UUID;
    v_visit_gracie_id UUID;
    v_event_id UUID;
    
    -- Status Enum
    v_status_visited TEXT := 'Visitada'; 
    
    -- Data
    v_mudita_vouchers TEXT[] := ARRAY['VRJ103', 'PSX622'];
    v_gracie_vouchers TEXT[] := ARRAY['NCF993', 'VVZ323', 'DZR462'];
    v_code TEXT;
BEGIN
    ---------------------------------------------------------------------------
    -- 0. BUSCAR UM EVENTO PADRÃO
    ---------------------------------------------------------------------------
    SELECT id INTO v_event_id FROM events ORDER BY created_at DESC LIMIT 1;
    
    IF v_event_id IS NULL THEN
        RAISE EXCEPTION '❌ Nenhum evento encontrado para associar as visitas.';
    END IF;

    ---------------------------------------------------------------------------
    -- 1. FIND ACADEMIES
    ---------------------------------------------------------------------------
    
    -- Mudita
    SELECT id INTO v_mudita_id FROM academies WHERE name ILIKE '%Mudita%' LIMIT 1;
    
    -- Gracie Barra Kissimmee
    SELECT id INTO v_gracie_id FROM academies WHERE name ILIKE '%Gracie Barra Kissimmee%' LIMIT 1;
    IF v_gracie_id IS NULL THEN
        SELECT id INTO v_gracie_id FROM academies WHERE name ILIKE '%Gracie Barra%' AND (city ILIKE '%Kissimmee%' OR address ILIKE '%Kissimmee%') LIMIT 1;
    END IF;

    ---------------------------------------------------------------------------
    -- 2. PROCESS MUDITA
    ---------------------------------------------------------------------------
    IF v_mudita_id IS NOT NULL THEN
        SELECT id INTO v_visit_mudita_id FROM visits WHERE academy_id = v_mudita_id ORDER BY created_at DESC LIMIT 1;

        IF v_visit_mudita_id IS NULL THEN
            INSERT INTO visits (event_id, academy_id, status, started_at, finished_at, summary, vouchers_generated)
            VALUES (v_event_id, v_mudita_id, v_status_visited, NOW() - INTERVAL '1 day', NOW(), 'Manual recovery of lost data', v_mudita_vouchers)
            RETURNING id INTO v_visit_mudita_id;
            RAISE NOTICE '✅ Created NEW visit for Mudita: %', v_visit_mudita_id;
        ELSE
            UPDATE visits 
            SET status = v_status_visited, 
                finished_at = COALESCE(finished_at, NOW()),
                vouchers_generated = v_mudita_vouchers
            WHERE id = v_visit_mudita_id;
            RAISE NOTICE '✅ Updated existing visit for Mudita: %', v_visit_mudita_id;
        END IF;

        FOREACH v_code IN ARRAY v_mudita_vouchers
        LOOP
            -- Removed 'status' column from insert
            INSERT INTO vouchers (code, academy_id, visit_id, event_id, created_at)
            VALUES (v_code, v_mudita_id, v_visit_mudita_id, v_event_id, NOW())
            ON CONFLICT (code) DO NOTHING;
        END LOOP;
    END IF;

    ---------------------------------------------------------------------------
    -- 3. PROCESS GRACIE BARRA
    ---------------------------------------------------------------------------
    IF v_gracie_id IS NOT NULL THEN
        SELECT id INTO v_visit_gracie_id FROM visits WHERE academy_id = v_gracie_id ORDER BY created_at DESC LIMIT 1;

        IF v_visit_gracie_id IS NULL THEN
            INSERT INTO visits (event_id, academy_id, status, started_at, finished_at, summary, vouchers_generated)
            VALUES (v_event_id, v_gracie_id, v_status_visited, NOW() - INTERVAL '1 day', NOW(), 'Manual recovery of lost data', v_gracie_vouchers)
            RETURNING id INTO v_visit_gracie_id;
            RAISE NOTICE '✅ Created NEW visit for Gracie Barra: %', v_visit_gracie_id;
        ELSE
            UPDATE visits 
            SET status = v_status_visited, 
                finished_at = COALESCE(finished_at, NOW()),
                vouchers_generated = v_gracie_vouchers
            WHERE id = v_visit_gracie_id;
            RAISE NOTICE '✅ Updated existing visit for Gracie Barra: %', v_visit_gracie_id;
        END IF;

        FOREACH v_code IN ARRAY v_gracie_vouchers
        LOOP
            -- Removed 'status' column from insert
            INSERT INTO vouchers (code, academy_id, visit_id, event_id, created_at)
            VALUES (v_code, v_gracie_id, v_visit_gracie_id, v_event_id, NOW())
            ON CONFLICT (code) DO NOTHING;
        END LOOP;
    END IF;

END $$;
