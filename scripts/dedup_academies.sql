-- ==============================================================
-- DEDUPLICAÇÃO: Manter apenas 1 registro por academia (pelo nome)
-- Mantém o mais antigo (created_at ASC), deleta os demais
-- ==============================================================

-- PASSO 1a: Remover da event_academies os duplicados que já têm
-- o registro canônico (keeper) vinculado ao mesmo evento
DELETE FROM event_academies ea
WHERE ea.academy_id IN (
  SELECT a2.id
  FROM academies a2
  JOIN (
    SELECT DISTINCT ON (name) id AS keeper_id, name
    FROM academies
    ORDER BY name, created_at ASC
  ) keeper ON keeper.name = a2.name AND keeper.keeper_id <> a2.id
  WHERE EXISTS (
    SELECT 1 FROM event_academies ea2
    WHERE ea2.event_id = ea.event_id
      AND ea2.academy_id = keeper.keeper_id
  )
);

-- PASSO 1b: Para os duplicados restantes em event_academies,
-- redirecionar para o keeper
UPDATE event_academies ea
SET academy_id = keeper.keeper_id
FROM (
  SELECT DISTINCT ON (name) id AS keeper_id, name
  FROM academies
  ORDER BY name, created_at ASC
) keeper
JOIN academies a2 ON a2.name = keeper.name AND a2.id <> keeper.keeper_id
WHERE ea.academy_id = a2.id;

-- PASSO 2: Atualizar referências em visits para o registro canônico
UPDATE visits v
SET academy_id = keeper.keeper_id
FROM (
  SELECT DISTINCT ON (name) id AS keeper_id, name
  FROM academies
  ORDER BY name, created_at ASC
) keeper
JOIN academies a2 ON a2.name = keeper.name AND a2.id <> keeper.keeper_id
WHERE v.academy_id = a2.id;

-- PASSO 3: Deletar academias duplicadas (mantém só o mais antigo por nome)
DELETE FROM academies
WHERE id NOT IN (
  SELECT DISTINCT ON (name) id
  FROM academies
  ORDER BY name, created_at ASC
);

-- VERIFICAÇÃO: deve retornar vazio se tudo correu bem
SELECT name, COUNT(*) AS total
FROM academies
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;
