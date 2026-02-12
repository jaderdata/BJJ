-- SCRIPT TO CHECK WHICH FABIN ROSA IS LINKED
SELECT ea.event_id, ea.academy_id, a.name, a.city 
FROM event_academies ea
JOIN academies a ON ea.academy_id = a.id
WHERE a.name ILIKE '%Fabin Rosa%' AND ea.is_active = true;
