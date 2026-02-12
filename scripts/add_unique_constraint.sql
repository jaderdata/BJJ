-- ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATE VISITS
-- This ensures that only ONE visit can exist per Event + Academy pair.

BEGIN;

-- 1. Ensure no duplicates exist before adding constraint (Safety Check)
-- If duplicates exist, this script will fail. The previous cleanup step should have handled this.
-- But if any remain, we must know.

DO $$ 
DECLARE
    v_duplicates_count INT;
BEGIN
    SELECT COUNT(*) INTO v_duplicates_count
    FROM (
        SELECT event_id, academy_id
        FROM visits
        GROUP BY event_id, academy_id
        HAVING COUNT(*) > 1
    ) sub;

    IF v_duplicates_count > 0 THEN
        RAISE EXCEPTION '❌ Cannot add constraint: % duplicate groups still exist. Please run cleanup first.', v_duplicates_count;
    END IF;
END $$;

-- 2. Add the Constraint
ALTER TABLE visits
ADD CONSTRAINT unique_visit_event_academy UNIQUE (event_id, academy_id);

COMMENT ON CONSTRAINT unique_visit_event_academy ON visits IS 'Ensures an academy can only be visited once per event.';

COMMIT;
