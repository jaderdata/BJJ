-- Test: Verify Visit Integrity Triggers
-- Description: Attempts to violate the new constraints to ensure they are working.

BEGIN;

-- 1. Create a dummy visit record (Status: VISITED)
INSERT INTO visits (id, academy_id, event_id, status, started_at, finished_at)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    (SELECT id FROM academies LIMIT 1),
    (SELECT id FROM events LIMIT 1),
    'Visitada',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Attempt to Regress Status (Should Fail)
DO $$
BEGIN
    UPDATE visits 
    SET status = 'Pendente' 
    WHERE id = '00000000-0000-0000-0000-000000000001';
    
    RAISE EXCEPTION 'TEST FAILED: Status regression was allowed!';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Regressão de Status Proibida%' THEN
        RAISE NOTICE 'TEST PASSED: Status regression blocked correctly.';
    ELSE
        RAISE EXCEPTION 'TEST FAILED: Unexpected error during regression test: %', SQLERRM;
    END IF;
END $$;

-- 3. Attempt to Delete Visited Record (Should Fail)
DO $$
BEGIN
    DELETE FROM visits 
    WHERE id = '00000000-0000-0000-0000-000000000001';
    
    RAISE EXCEPTION 'TEST FAILED: Deletion of visited record was allowed!';
EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Proteção de Integridade%' THEN
        RAISE NOTICE 'TEST PASSED: Deletion blocked correctly.';
    ELSE
        RAISE EXCEPTION 'TEST FAILED: Unexpected error during deletion test: %', SQLERRM;
    END IF;
END $$;

-- cleanup (Force delete if needed, but we can just rollback transaction to be clean)
ROLLBACK;
