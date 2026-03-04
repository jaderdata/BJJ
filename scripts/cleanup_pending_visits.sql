-- ==============================================================
-- LIMPEZA: Remover visitas 'Pendente' inseridas incorretamente
-- O app cria visitas automaticamente ao tocar na academia.
-- Visitas com status 'Pendente' inseridas via SQL causam o bug
-- de "Em andamento" em série.
-- ==============================================================

-- Deleta todas as visitas com status 'Pendente' vinculadas ao evento
DELETE FROM visits
WHERE status = 'Pendente'
  AND event_id = (
    SELECT id FROM events
    WHERE name = 'PBJJF Charlotte Spring International Open 2026'
    ORDER BY created_at DESC
    LIMIT 1
  );
