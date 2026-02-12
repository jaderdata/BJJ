
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'academies';

SELECT * FROM academies WHERE name ILIKE '%Gracie Barra Kissimmee%';
