-- Inspect Triggers on visits table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'visits';

-- Inspect the test record
SELECT id, status FROM visits WHERE id = '00000000-0000-0000-0000-000000000001';
