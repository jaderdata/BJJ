-- Check for duplicate visits (more than 1 visit per event/academy pair)
SELECT 
    event_id, 
    academy_id, 
    COUNT(*) as visit_count,
    array_agg(id) as visit_ids,
    array_agg(status) as statuses,
    array_agg(created_at) as created_ats
FROM visits
GROUP BY event_id, academy_id
HAVING COUNT(*) > 1;
