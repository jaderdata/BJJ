-- Enable pgcrypto extension to fix "function gen_random_bytes(integer) does not exist" error
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;

-- Verification: check if the function exists after enabling
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'gen_random_bytes') THEN
        RAISE NOTICE 'Extension pgcrypto enabled but function gen_random_bytes not found in pg_proc';
    ELSE
        RAISE NOTICE 'pgcrypto enabled and gen_random_bytes found.';
    END IF;
END $$;
