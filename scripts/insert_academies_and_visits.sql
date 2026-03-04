-- ===========================================================
-- SCRIPT: Inserir Academias + Vincular ao Evento (Pendentes)
-- Evento   : PBJJF Charlotte Spring International Open 2026
-- ===========================================================
-- EXECUTE OS 2 PASSOS NA ORDEM:
-- PASSO 1: Inserir academias (seguro, ignora duplicatas pelo nome)
-- PASSO 2: Vincular ao evento via event_academies
-- ===========================================================

-- ▶ PASSO 1: Inserir apenas academias que ainda não existem pelo nome
INSERT INTO academies (name, address, city, state, responsible, phone, status)
SELECT v.name, v.address, v.city, v.state, v.responsible, v.phone, v.status
FROM (VALUES
  ('CheckMat Charlotte', '10210 Couloak Dr', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Charlotte Jiu-Jitsu Academy', '2122 Thrift Rd Unit C', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Fight To Win (FTW) Charlotte', '5108 Reagan Dr', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Fight To Win (FTW) Concord', '8230 Poplar Tent Rd Unit 102', 'Concord', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Evolution Fitness of Concord', '25 Buffalo Ave NW', 'Concord', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Cornelius Jiu-Jitsu Academy', '20488 Chartwell Center Dr Ste C', 'Cornelius', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Wander Braga BJJ (Cornelius)', '18047 W Catawba Ave Ste C', 'Cornelius', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Gracie Barra Lake Norman', '11020 Bailey Rd', 'Cornelius', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Fenix Jiu Jitsu', '841 8th Ave NE', 'Hickory', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Atlantic MMA', '1614 Tate Blvd SE', 'Hickory', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Honest Grappling Company', '1772 Dale Earnhardt Blvd', 'Kannapolis', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Wander Braga BJJ (Kannapolis)', '6001 Kannapolis Pkwy Suite 109', 'Kannapolis', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Bonsai Jiu-Jitsu Academy', '112 S Center St', 'Statesville', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Guerilla MMA (Albemarle)', '815 N First St', 'Albemarle', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Ballantyne Kicks', '15105-H John J Delaney Dr', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('BodyShot Combat Club', '110 Main St', 'Belmont', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Lucas Lepri BJJ (Charlotte)', '9129 Monroe Rd Suite 140', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Gracie Barra Charlotte', '4128 South Blvd Ste B-2', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Royce Gracie Jiu-Jitsu', '10100 Park Cedar Dr', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Arte Suave / GFTeam CLT', '13340 S Point Blvd', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Brazilian Top Team (BTT)', '10701 Park Rd', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Leadership Martial Arts', '9928 S Tryon St', 'Charlotte', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Arte Suave Academy (Denver)', '1000 NC-16 Business', 'Denver', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Lucas Lepri (Fort Mill)', '1852 Highway 160 Suite 105', 'Fort Mill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Great Grappling BJJ', '2040 Carolina Pl Dr', 'Fort Mill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Triumph Fight Academy', '9516 Charlotte Hwy', 'Fort Mill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Solecki Jiu Jitsu', '4478 Posterity Ct', 'Gastonia', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('McGinnis Academy', '5106 A Wilkinson Blvd', 'Gastonia', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Royce Gracie (Harrisburg)', '4947 Hwy 49 S', 'Harrisburg', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Art of Motion Jiu Jitsu', '4400 Indian Trail Fairview Rd', 'Indian Trail', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Fightworks Academy', '1245 University Dr', 'Lancaster', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Rubedo Brazilian Jiu Jitsu', '114 E Main St', 'Lincolnton', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Guerilla MMA (Locust)', '150 Ray Kennedy Dr Suite 126', 'Locust', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Mecklenburg Martial Arts', '1307 Matthews-Mint Hill Rd Unit B', 'Matthews', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('4M Fitness', '1150 Crews Rd Suite A', 'Matthews', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Mint Hill Jiu-Jitsu', '7800 G Stevens Mill Rd', 'Matthews', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Carlson Gracie Charlotte', '9044 Lawyers Rd', 'Mint Hill', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Monroe Jiu-Jitsu Academy', '104 Union St S', 'Monroe', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Gracie Jiu-Jitsu Monroe', '1615 W Roosevelt Blvd', 'Monroe', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Zen Jiu-Jitsu & Fitness', '4612 W Hwy 74 Suite E', 'Monroe', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Gracie Lake Norman', '159-A Raceway Dr', 'Mooresville', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Top Martial Arts (Pineville)', '525 N Polk St', 'Pineville', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Fight Sports Charlotte', '11812 Carolina Place Pkwy', 'Pineville', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('TAP World Class BJJ', '1539 Celanese Rd Suite 103', 'Rock Hill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Carolina Family Jiu Jitsu', '2550 W Main St Suite 131', 'Rock Hill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Modern Warrior MMA', '774 Corporate Blvd Suite 105', 'Rock Hill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Rock Hill BJJ', '489 S Herlong Ave Suite 6', 'Rock Hill', 'SC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Green Team Jiu Jitsu', '101 S Hancock St', 'Rockingham', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Fight Factory', '1810 E Innes St', 'Salisbury', 'NC', 'Não informado', 'Não informado', 'ACTIVE'),
  ('Next Gen Jiu Jitsu', '820 S Post Rd', 'Shelby', 'NC', 'Não informado', 'Não informado', 'ACTIVE')
) AS v(name, address, city, state, responsible, phone, status)
WHERE NOT EXISTS (
  SELECT 1 FROM academies a WHERE a.name = v.name
);

-- ▶ PASSO 2: Vincular todas as 50 academias ao evento (aparecem como PENDENTES)
-- Usa o nome para buscar os IDs com segurança — pega apenas o mais recente caso haja duplicatas
INSERT INTO event_academies (event_id, academy_id, is_active)
SELECT
  (SELECT id FROM events WHERE name = 'PBJJF Charlotte Spring International Open 2026' ORDER BY created_at DESC LIMIT 1),
  a.id,
  true
FROM academies a
WHERE a.name IN (
  'CheckMat Charlotte',
  'Charlotte Jiu-Jitsu Academy',
  'Fight To Win (FTW) Charlotte',
  'Fight To Win (FTW) Concord',
  'Evolution Fitness of Concord',
  'Cornelius Jiu-Jitsu Academy',
  'Wander Braga BJJ (Cornelius)',
  'Gracie Barra Lake Norman',
  'Fenix Jiu Jitsu',
  'Atlantic MMA',
  'Honest Grappling Company',
  'Wander Braga BJJ (Kannapolis)',
  'Bonsai Jiu-Jitsu Academy',
  'Guerilla MMA (Albemarle)',
  'Ballantyne Kicks',
  'BodyShot Combat Club',
  'Lucas Lepri BJJ (Charlotte)',
  'Gracie Barra Charlotte',
  'Royce Gracie Jiu-Jitsu',
  'Arte Suave / GFTeam CLT',
  'Brazilian Top Team (BTT)',
  'Leadership Martial Arts',
  'Arte Suave Academy (Denver)',
  'Lucas Lepri (Fort Mill)',
  'Great Grappling BJJ',
  'Triumph Fight Academy',
  'Solecki Jiu Jitsu',
  'McGinnis Academy',
  'Royce Gracie (Harrisburg)',
  'Art of Motion Jiu Jitsu',
  'Fightworks Academy',
  'Rubedo Brazilian Jiu Jitsu',
  'Guerilla MMA (Locust)',
  'Mecklenburg Martial Arts',
  '4M Fitness',
  'Mint Hill Jiu-Jitsu',
  'Carlson Gracie Charlotte',
  'Monroe Jiu-Jitsu Academy',
  'Gracie Jiu-Jitsu Monroe',
  'Zen Jiu-Jitsu & Fitness',
  'Gracie Lake Norman',
  'Top Martial Arts (Pineville)',
  'Fight Sports Charlotte',
  'TAP World Class BJJ',
  'Carolina Family Jiu Jitsu',
  'Modern Warrior MMA',
  'Rock Hill BJJ',
  'Green Team Jiu Jitsu',
  'Fight Factory',
  'Next Gen Jiu Jitsu'
)
-- Se houver duplicata de nome, pega apenas 1 por nome (a mais recente)
AND a.id IN (
  SELECT DISTINCT ON (name) id FROM academies ORDER BY name, created_at DESC
)
ON CONFLICT (event_id, academy_id) DO UPDATE SET is_active = true;
