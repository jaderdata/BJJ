
DO $$ 
DECLARE
    mudita_id UUID := '8d931a39-e226-40ba-858a-3fba047e4120';
    v_visit_record RECORD;
    v_vouchers TEXT[] := ARRAY['VRJ103', 'PSX622'];
    v_code TEXT;
    v_count INT;
BEGIN
    -- 1. Buscando visita mais recente
    SELECT * INTO v_visit_record FROM visits 
    WHERE academy_id = mudita_id 
    ORDER BY created_at DESC LIMIT 1;

    IF v_visit_record.id IS NULL THEN
        RAISE NOTICE '⚠️ Nenhuma visita encontrada para Mudita. Verifique se foi deletada.';
    ELSE
        -- 2. Atualizar Status para VISITED se necessário
        IF v_visit_record.status != 'VISITED' THEN
            UPDATE visits 
            SET status = 'VISITED', 
                finished_at = COALESCE(finished_at, now()),
                vouchers_generated = CASE 
                    WHEN array_length(COALESCE(vouchers_generated, ARRAY[]::text[]), 1) > 0 THEN vouchers_generated 
                    ELSE v_vouchers 
                END
            WHERE id = v_visit_record.id;
            
            RAISE NOTICE '✅ Visita atualizada para VISITED: %', v_visit_record.id;
        ELSE
            RAISE NOTICE 'ℹ️ Visita já está VISITED.';
        END IF;

        -- Recarregar registro atualizado
        SELECT * INTO v_visit_record FROM visits WHERE id = v_visit_record.id;

        -- 3. Inserir Vouchers
        FOREACH v_code IN ARRAY COALESCE(v_visit_record.vouchers_generated, v_vouchers)
        LOOP
            INSERT INTO vouchers (code, academy_id, visit_id, status, created_at)
            VALUES (v_code, mudita_id, v_visit_record.id, 'ACTIVE', now())
            ON CONFLICT (code) DO NOTHING;
        END LOOP;

        -- 4. Contar vouchers atuais
        SELECT COUNT(*) INTO v_count FROM vouchers WHERE visit_id = v_visit_record.id;
        RAISE NOTICE '✅ Total de Vouchers após correção: %', v_count;
    END IF;
END $$;
