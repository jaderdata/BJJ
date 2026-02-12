
-- ============================================================================
-- SCRIPT DE INTEGRIDADE DO BANCO DE DADOS
-- ============================================================================
-- Este script aplica regras estritas para garantir que:
-- 1. Não existam visitas órfãs (sem evento ou academia).
-- 2. Não existam vouchers órfãos (sem visita).
-- 3. Não existam duplicatas de visitas.
-- 4. Ao deletar um evento ou academia, os dados relacionados sejam limpos automaticamente (CASCADE).
-- ============================================================================

-- 1. Tabela VISITS (Integridade Referencial)
-- ----------------------------------------------------------------------------
-- Garante que se um Evento for deletado, suas visitas somem.
ALTER TABLE visits
DROP CONSTRAINT IF EXISTS visits_event_id_fkey;

ALTER TABLE visits
ADD CONSTRAINT visits_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE CASCADE;

-- Garante que se uma Academia for deletada, suas visitas somem.
ALTER TABLE visits
DROP CONSTRAINT IF EXISTS visits_academy_id_fkey;

ALTER TABLE visits
ADD CONSTRAINT visits_academy_id_fkey
    FOREIGN KEY (academy_id)
    REFERENCES academies(id)
    ON DELETE CASCADE;

-- Garante UNICIDADE: Uma academia só pode ser visitada uma vez por evento.
-- Se tentar inserir duplicado, o banco bloqueará.
ALTER TABLE visits
DROP CONSTRAINT IF EXISTS unique_event_academy_visit;

ALTER TABLE visits
ADD CONSTRAINT unique_event_academy_visit UNIQUE (event_id, academy_id);


-- 2. Tabela VOUCHERS (Integridade Referencial)
-- ----------------------------------------------------------------------------
-- Se a visita for deletada, os vouchers dela somem.
ALTER TABLE vouchers
DROP CONSTRAINT IF EXISTS vouchers_visit_id_fkey;

ALTER TABLE vouchers
ADD CONSTRAINT vouchers_visit_id_fkey
    FOREIGN KEY (visit_id)
    REFERENCES visits(id)
    ON DELETE CASCADE;


-- 3. Tabela EVENT_ACADEMIES (Junção)
-- ----------------------------------------------------------------------------
ALTER TABLE event_academies
DROP CONSTRAINT IF EXISTS event_academies_event_id_fkey;

ALTER TABLE event_academies
ADD CONSTRAINT event_academies_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE CASCADE;

ALTER TABLE event_academies
DROP CONSTRAINT IF EXISTS event_academies_academy_id_fkey;

ALTER TABLE event_academies
ADD CONSTRAINT event_academies_academy_id_fkey
    FOREIGN KEY (academy_id)
    REFERENCES academies(id)
    ON DELETE CASCADE;


-- 4. Tabela NOTIFICATIONS (Integridade com Usuários)
-- ----------------------------------------------------------------------------
-- User ID deve existir em auth.users (ou app_users se fosse o caso, mas notifications usa auth.users original)
-- Se o app usa auth.users, ok. Se usa app_users, este FK pode falhar se não estiverem sincronizados.
-- Deixaremos como está se já existir, ou adicionaremos CASCADE se for seguro.
-- Assumindo que notifications usa o ID do Supabase Auth:
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- 5. Segurança (RLS)
-- ----------------------------------------------------------------------------
-- Reafirmar permissões para garantir funcionamento do App (já que usa chave anônima).
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for all users" ON visits;
CREATE POLICY "Enable access for all users" ON visits FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for all users" ON vouchers;
CREATE POLICY "Enable access for all users" ON vouchers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for all users" ON events;
CREATE POLICY "Enable access for all users" ON events FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for all users" ON academies;
CREATE POLICY "Enable access for all users" ON academies FOR ALL USING (true) WITH CHECK (true);


SELECT '✅ Regras de integridade aplicadas com sucesso!' as status;
