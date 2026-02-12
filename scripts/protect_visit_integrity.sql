-- Migration: Protect Visit Status Integrity
-- Description: Prevents status regression from 'VISITED' to 'PENDING' and accidental deletion of visited records.

BEGIN;

-- 1. Create function to prevent status regression
CREATE OR REPLACE FUNCTION prevent_visit_status_regression()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o status antigo era 'Visitada' e o novo é 'Pendente', bloquear.
    -- (Permitir se for o mesmo status ou se estiver mudando para outro status final, se houver)
    IF OLD.status = 'Visitada' AND NEW.status = 'Pendente' THEN
        RAISE EXCEPTION 'Regressão de Status Proibida: Uma visita concluída não pode voltar para pendente.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger for UPDATE
DROP TRIGGER IF EXISTS trg_prevent_visit_regression ON visits;
CREATE TRIGGER trg_prevent_visit_regression
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION prevent_visit_status_regression();

-- 3. Create function to prevent deletion of visited records
CREATE OR REPLACE FUNCTION prevent_visit_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Se a visita está concluída, não permitir deleção (soft delete seria melhor, mas bloqueio é o pedido)
    IF OLD.status = 'Visitada' THEN
        RAISE EXCEPTION 'Proteção de Integridade: Não é permitido deletar uma visita concluída.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for DELETE
DROP TRIGGER IF EXISTS trg_prevent_visit_deletion ON visits;
CREATE TRIGGER trg_prevent_visit_deletion
    BEFORE DELETE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION prevent_visit_deletion();

COMMIT;
