-- ===========================================================
-- SCRIPT: Inserir Academias + Vincular ao Evento (Pendentes)
-- Evento   : PBJJF Charleston Spring International Open 2026
-- Total    : 52 academias
-- ===========================================================
-- EXECUTE OS 2 PASSOS NA ORDEM:
-- PASSO 1: Inserir academias (seguro, ignora duplicatas pelo nome)
-- PASSO 2: Vincular ao evento via event_academies
-- ===========================================================

-- ▶ PASSO 1: Inserir apenas academias que ainda não existem pelo nome
INSERT INTO academies (name, address, city, state, responsible, phone, email, status)
SELECT v.name, v.address, v.city, v.state, v.responsible, v.phone, v.email, v.status
FROM (VALUES
  ('Academy of Martial Arts',          '431B St James Ave',                       'Goose Creek',        'SC', 'General',          '(843) 553-5425', NULL,                                  'ACTIVE'),
  ('American Jiu-Jitsu Academy',       '3208 Mill St',                            'Summerville',        'SC', 'General',          '(843) 873-6100', NULL,                                  'ACTIVE'),
  ('Beaufort MMA',                     '2127 Boundary St, Ste 18-B',              'Beaufort',           'SC', 'General',          '(843) 882-7688', NULL,                                  'ACTIVE'),
  ('Believe Brazilian Jiu Jitsu',      '117 N Creek Dr, Unit B',                  'Summerville',        'SC', 'Randy Gonzales',   '(843) 585-3465', NULL,                                  'ACTIVE'),
  ('Blue Phoenix Academy',             '1885 Glenns Bay Rd',                      'Myrtle Beach',       'SC', 'General',          '(516) 250-2812', NULL,                                  'ACTIVE'),
  ('Brazilian Top Team Charleston',    '1725 N Main St',                          'Summerville',        'SC', 'General',          '(501) 844-1883', NULL,                                  'ACTIVE'),
  ('Chango BJJ',                       '2139 North Main St, Suite N',             'Summerville',        'SC', 'Chris Popdan',     '(843) 471-1111', 'changobjj@gmail.com',                 'ACTIVE'),
  ('Charleston Brazilian Jiu-Jitsu Academy', '7644 Southrail Rd, Unit 100-B',    'North Charleston',   'SC', 'Nate Sisco',       '(843) 476-2635', NULL,                                  'ACTIVE'),
  ('Charleston Krav Maga & MMA',       '1250 Wappoo Rd',                          'Charleston',         'SC', 'General',          '(843) 225-5425', NULL,                                  'ACTIVE'),
  ('CheckMat Columbia',                '206 Business Park Blvd, Suite B',         'Columbia',           'SC', 'General',          '(803) 530-6937', NULL,                                  'ACTIVE'),
  ('Checkmat Myrtle Beach',            '3721 Wesley Street',                      'Myrtle Beach',       'SC', 'General',          '(843) 236-1234', NULL,                                  'ACTIVE'),
  ('Columbia Martial Arts & Fitness',  '10107 Two Notch Rd',                      'Columbia',           'SC', 'General',          '(803) 788-2622', NULL,                                  'ACTIVE'),
  ('Cross Rhodes Training Academy',    '1 Sherington Dr, Suite D',                'Bluffton',           'SC', 'General',          '(843) 815-5425', NULL,                                  'ACTIVE'),
  ('Fightworks Academy',               'Orangeburg',                              'Orangeburg',         'SC', 'General',          '(703) 863-7843', 'info@fightworks.net',                 'ACTIVE'),
  ('Five Star BJJ & Grappling',        '4307 Ogeechee Rd, Suite 101',             'Savannah',           'GA', 'General',          '(912) 233-5555', NULL,                                  'ACTIVE'),
  ('Fusion Grappling Club',            '2127 Boundary St',                        'Beaufort',           'SC', 'General',          '(843) 732-1822', NULL,                                  'ACTIVE'),
  ('Georgetown Martial Arts Academy',  '1911 Highmarket St',                      'Georgetown',         'SC', 'General',          '(843) 902-3348', NULL,                                  'ACTIVE'),
  ('Gracie Barra Charleston (Mount Pleasant)', '1956 Long Grove Dr, Ste 3',       'Mount Pleasant',     'SC', 'General',          '(843) 653-9153', NULL,                                  'ACTIVE'),
  ('Gracie Barra North Charleston',    '7671 Northwoods Blvd, Unit H',            'North Charleston',   'SC', 'General',          '(843) 608-8727', 'info@gbnorthcharleston.com',          'ACTIVE'),
  ('Gracie Barra West Ashley',         '874 Orleans Rd, Unit 4',                  'Charleston',         'SC', 'Fabio Costa',      '(843) 603-8777', NULL,                                  'ACTIVE'),
  ('Gracie Jiu Jitsu of Charleston',   '2070 Sam Rittenberg Blvd, Unit 752',      'Charleston',         'SC', 'General',          '(843) 377-5361', NULL,                                  'ACTIVE'),
  ('Gracie Jiu-Jitsu Hilton Head',     '37 New Orleans Rd, Suite P',              'Hilton Head Island', 'SC', 'Anibal Lobo',      '(843) 300-0324', 'anibal@graciejiujitsuhiltonhead.com', 'ACTIVE'),
  ('Gracie Jiu-Jitsu Savannah',        '904 E 70th St',                           'Savannah',           'GA', 'General',          '(912) 346-0917', NULL,                                  'ACTIVE'),
  ('Hanahan Jiu Jitsu',                '1177 Williams Ln',                        'Hanahan',            'SC', 'General',          '(770) 317-7109', NULL,                                  'ACTIVE'),
  ('Hitman Jiu Jitsu',                 '1100 Eisenhower Dr',                      'Savannah',           'GA', 'General',          '(912) 354-3434', NULL,                                  'ACTIVE'),
  ('Holy City Jiu Jitsu',              '1622 Camp Rd',                            'James Island',       'SC', 'General',          '(843) 345-8152', 'holycityjiujitsu@gmail.com',          'ACTIVE'),
  ('Houzn Jiu Jitsu Academy',          '498 Wando Park Blvd, Suite 100',          'Mount Pleasant',     'SC', 'Rafaello Oliveira','(843) 327-5298', 'contact@houznjiujitsu.academy',       'ACTIVE'),
  ('JB Martial Arts',                  '965 Summers Ave',                         'Orangeburg',         'SC', 'General',          '(803) 997-0852', 'jbmartialartsstudio@gmail.com',       'ACTIVE'),
  ('Karate World Pawleys Island',      '115 Willbrook Blvd, Unit Q',              'Pawleys Island',     'SC', 'General',          '(843) 828-4386', NULL,                                  'ACTIVE'),
  ('Karate World Surfside Beach',      '614 Atlantic Ave, Unit C',                'Garden City',        'SC', 'General',          '(843) 828-4386', NULL,                                  'ACTIVE'),
  ('Kilo Delta BJJ',                   '1012 16th Ave NW',                        'Surfside Beach',     'SC', 'General',          '(843) 238-1234', NULL,                                  'ACTIVE'),
  ('Legion Academy of Martial Arts',   '1105 Middleton St',                       'Beaufort',           'SC', 'General',          '(843) 300-0324', NULL,                                  'ACTIVE'),
  ('Lionheart MMA & Fitness',          '333 Miracle Park Drive, Suite F',         'Moncks Corner',      'SC', 'General',          '(843) 499-1259', NULL,                                  'ACTIVE'),
  ('Lowcountry Grappling Arts',        '110 S Jefferies Blvd',                    'Walterboro',         'SC', 'Stephan LaPresta', '(843) 539-6450', 'stephanlapresta@gmail.com',           'ACTIVE'),
  ('McElroy''s Martial Arts Academy',  '2 Foxhunt Dr',                            'Hilton Head Island', 'SC', 'General',          '(843) 681-3456', NULL,                                  'ACTIVE'),
  ('Myrtle Beach Judo & Jiu Jitsu',    '3334 US-17 BUS',                          'Murrells Inlet',     'SC', 'General',          '(843) 651-1234', NULL,                                  'ACTIVE'),
  ('Power of JiuJitsu',                '104-B St James Ave',                      'Goose Creek',        'SC', 'General',          '(843) 324-5856', 'info@pobjj.com',                      'ACTIVE'),
  ('RDT Academy BJJ',                  '206 George Bishop Pkwy, Unit A',          'Myrtle Beach',       'SC', 'General',          '(650) 630-2247', NULL,                                  'ACTIVE'),
  ('Relson Gracie Academy of Jiu Jitsu (Myrtle Beach)', '3901 Highway 17 Byp S', 'Myrtle Beach',       'SC', 'General',          '(843) 236-1234', NULL,                                  'ACTIVE'),
  ('Relson Gracie Jiu-Jitsu Georgetown','210 S Fraser St',                        'Georgetown',         'SC', 'Jay Dennis',       '(843) 546-8681', 'jaydennisgt@hotmail.com',             'ACTIVE'),
  ('Rugged MMA',                       '1885 Glenns Bay Road',                    'Surfside Beach',     'SC', 'General',          '(516) 250-2812', NULL,                                  'ACTIVE'),
  ('Savannah''s Black Belt Academy',   '7720 Waters Ave',                         'Savannah',           'GA', 'General',          '(912) 354-3434', NULL,                                  'ACTIVE'),
  ('TAP Brazilian Jiu-Jitsu Academy',  '4812 Stono Links Dr',                     'Hollywood',          'SC', 'General',          '(843) 514-1192', NULL,                                  'ACTIVE'),
  ('TNT Martial Arts & Fitness',       '1330 Knox Abbott Drive',                  'Cayce',              'SC', 'Tim Goodwin',      '(803) 796-0007', NULL,                                  'ACTIVE'),
  ('Team Martial Arts',                '214 Saint James Avenue, #240',            'Goose Creek',        'SC', 'General',          '(843) 324-7891', NULL,                                  'ACTIVE'),
  ('The Next Element Academy',         '3811 N Kings Hwy, Suite 30',              'Myrtle Beach',       'SC', 'General',          '(843) 839-0000', NULL,                                  'ACTIVE'),
  ('The Stillness Gym',                '2127 Boundary St',                        'Beaufort',           'SC', 'General',          '(843) 882-7688', NULL,                                  'ACTIVE'),
  ('Titan Jiujitsu LLC',               '208 West Doty Avenue',                    'Summerville',        'SC', 'General',          '(843) 821-4111', NULL,                                  'ACTIVE'),
  ('Toe 2 Toe MMA & Fitness',          '306 Ivanhoe Dr',                          'Walterboro',         'SC', 'General',          '(843) 549-1515', NULL,                                  'ACTIVE'),
  ('Victory Academy Jiu Jitsu',        '6 Shwartz Pl',                            'Savannah',           'GA', 'Amy Campo Weaver', '(385) 238-6916', 'Amycampofighter@gmail.com',           'ACTIVE'),
  ('Viktos Jiu Jitsu',                 '6548 Ward Ave, Suite 8',                  'North Charleston',   'SC', 'Zach Baron',       '(843) 405-7001', 'zachbaron2012@gmail.com',             'ACTIVE'),
  ('Walterboro Karate & Defense Arts', '922 S Jefferies Blvd',                    'Walterboro',         'SC', 'General',          '(843) 844-7008', NULL,                                  'ACTIVE')
) AS v(name, address, city, state, responsible, phone, email, status)
WHERE NOT EXISTS (
  SELECT 1 FROM academies a WHERE a.name = v.name
);

-- ▶ PASSO 2: Vincular todas as 52 academias ao evento (aparecem como PENDENTES)
-- Usa o nome para buscar os IDs com segurança — pega apenas o mais recente caso haja duplicatas
INSERT INTO event_academies (event_id, academy_id, is_active)
SELECT
  (SELECT id FROM events WHERE name = 'PBJJF Charleston Spring International Open 2026' ORDER BY created_at DESC LIMIT 1),
  a.id,
  true
FROM academies a
WHERE a.name IN (
  'Academy of Martial Arts',
  'American Jiu-Jitsu Academy',
  'Beaufort MMA',
  'Believe Brazilian Jiu Jitsu',
  'Blue Phoenix Academy',
  'Brazilian Top Team Charleston',
  'Chango BJJ',
  'Charleston Brazilian Jiu-Jitsu Academy',
  'Charleston Krav Maga & MMA',
  'CheckMat Columbia',
  'Checkmat Myrtle Beach',
  'Columbia Martial Arts & Fitness',
  'Cross Rhodes Training Academy',
  'Fightworks Academy',
  'Five Star BJJ & Grappling',
  'Fusion Grappling Club',
  'Georgetown Martial Arts Academy',
  'Gracie Barra Charleston (Mount Pleasant)',
  'Gracie Barra North Charleston',
  'Gracie Barra West Ashley',
  'Gracie Jiu Jitsu of Charleston',
  'Gracie Jiu-Jitsu Hilton Head',
  'Gracie Jiu-Jitsu Savannah',
  'Hanahan Jiu Jitsu',
  'Hitman Jiu Jitsu',
  'Holy City Jiu Jitsu',
  'Houzn Jiu Jitsu Academy',
  'JB Martial Arts',
  'Karate World Pawleys Island',
  'Karate World Surfside Beach',
  'Kilo Delta BJJ',
  'Legion Academy of Martial Arts',
  'Lionheart MMA & Fitness',
  'Lowcountry Grappling Arts',
  'McElroy''s Martial Arts Academy',
  'Myrtle Beach Judo & Jiu Jitsu',
  'Power of JiuJitsu',
  'RDT Academy BJJ',
  'Relson Gracie Academy of Jiu Jitsu (Myrtle Beach)',
  'Relson Gracie Jiu-Jitsu Georgetown',
  'Rugged MMA',
  'Savannah''s Black Belt Academy',
  'TAP Brazilian Jiu-Jitsu Academy',
  'TNT Martial Arts & Fitness',
  'Team Martial Arts',
  'The Next Element Academy',
  'The Stillness Gym',
  'Titan Jiujitsu LLC',
  'Toe 2 Toe MMA & Fitness',
  'Victory Academy Jiu Jitsu',
  'Viktos Jiu Jitsu',
  'Walterboro Karate & Defense Arts'
)
-- Se houver duplicata de nome, pega apenas 1 por nome (a mais recente)
AND a.id IN (
  SELECT DISTINCT ON (name) id FROM academies ORDER BY name, created_at DESC
)
ON CONFLICT (event_id, academy_id) DO UPDATE SET is_active = true;
