-- Script para inserir academias e vinculá-las ao evento "PBJJF Atlanta Spring International Open 2026"

DO $$ 
DECLARE
    v_event_id UUID;
    v_academy_record RECORD;
    v_new_academy_id UUID;
BEGIN
    -- 1. Obter o ID do evento alvo
    SELECT id INTO v_event_id 
    FROM events 
    WHERE name = 'PBJJF Atlanta Spring International Open 2026' 
    LIMIT 1;

    IF v_event_id IS NULL THEN
        RAISE EXCEPTION 'Erro: Evento "PBJJF Atlanta Spring International Open 2026" não encontrado no banco de dados.';
    END IF;

    -- 2. Criar tabela temporária com os dados das academias a serem inseridas
    CREATE TEMP TABLE temp_atlanta_academies (
        name TEXT,
        address TEXT,
        city TEXT,
        state TEXT
    ) ON COMMIT DROP;

    -- Inserir os dados na tabela temporária
    INSERT INTO temp_atlanta_academies (name, address, city, state) VALUES
    ('Odyssey Jiu-Jitsu', '1530 Carroll Dr NW #105', 'Atlanta', 'GA'),
    ('Buckhead Jiu-Jitsu', '2144 Hills Ave NW', 'Atlanta', 'GA'),
    ('American Top Team Atlanta', '2144 Faulkner Rd NE', 'Atlanta', 'GA'),
    ('Alliance Jiu Jitsu Atlanta', '5290 Roswell Rd STE A170', 'Sandy Springs', 'GA'),
    ('Alliance BJJ Roswell', '2300 Holcomb Bridge Rd Suite 309', 'Roswell', 'GA'),
    ('SPARTAK Atlanta - Judo, Bjj, and Fitness', '11130 State Bridge Rd Suite B105-106', 'Johns Creek', 'GA'),
    ('Ascension MMA Alpharetta', '5620 Commerce Blvd Suite L', 'Alpharetta', 'GA'),
    ('Creighton Mixed Martial Arts Academy', '460 Brogdon Rd STE 200', 'Suwanee', 'GA'),
    ('IronBorn Jiu-Jitsu / Alex Daltro', '1342 Auburn Rd # 107', 'Dacula', 'GA'),
    ('Team Mongoose BJJ', 'Behind Pho 24 Vietnamese Grill, 1760 Old Norcross Rd suite V', 'Lawrenceville', 'GA'),
    ('Temporal Brazilian Jiu Jitsu Academy', '8020 Mall Pkwy Suite 1101', 'Stonecrest', 'GA'),
    ('Wolfhunter JiuJitsu Club', '123 S 5th St', 'Griffin', 'GA'),
    ('XL VCB Martial Arts Academy', '2100 GA-54 ste.105A', 'Peachtree City', 'GA'),
    ('Independent MMA & Fitness of Newnan, GA', '40 Greenway Ct', 'Newnan', 'GA'),
    ('Integrity BJJ & Fitness', '728 Bankhead Hwy', 'Carrollton', 'GA'),
    ('Tapout Martial Arts', '11111 Serenbe Ln', 'Chattahoochee Hills', 'GA'),
    ('Alliance Theatre', '1280 Peachtree St NE', 'Atlanta', 'GA'),
    ('Aníbal Jiu Jitsu Atlanta', '3200 Cobb Galleria Pkwy suite 220', 'Atlanta', 'GA'),
    ('Gracie Jiu Jitsu - J3 Academy', '13695 GA-9', 'Milton', 'GA'),
    ('Union Team BJJ', '5905 Atlanta Hwy STE 109', 'Alpharetta', 'GA'),
    ('Gracie Barra South Forsyth', '4415 Front 9 Dr Suite 400', 'Cumming', 'GA'),
    ('SBG Atlanta - Buford', '4989 Lanier Islands Pkwy', 'Buford', 'GA'),
    ('Iron Wolf Academy', '1247 Tuscany Dr Suite D', 'Braselton', 'GA'),
    ('Ninety5 Jiu Jitsu', '3255 Lawrenceville-Suwanee Rd Suite J', 'Suwanee', 'GA'),
    ('Gracie Barra Lawrenceville', '2100 Riverside Pkwy Suite 119A', 'Lawrenceville', 'GA'),
    ('American Top Team - Team Lima', '3650 Satellite Blvd Suite A', 'Duluth', 'GA'),
    ('Diego Saraiva Brazilian Jiu Jitsu / Nova União Atlanta', '6290 McDonough Dr NW STE H', 'Norcross', 'GA'),
    ('Team Octopus Fitness Chamblee', '3695 Longview Dr', 'Chamblee', 'GA'),
    ('Atlanta Combatives', '3293 Buford Hwy NE #500', 'Atlanta', 'GA'),
    ('SBG Atlanta - Druid Hills', '1799 Briarcliff Rd NE Suite V', 'Atlanta', 'GA'),
    ('Superfly BJJ', '431 W Ponce de Leon Ave', 'Decatur', 'GA'),
    ('X3 Sports - West Midtown', '1092 Huff Rd NW', 'Atlanta', 'GA'),
    ('Tribe Brazilian Jiu-Jitsu', '2000 Powers Ferry Rd Suite 2002', 'Marietta', 'GA'),
    ('Atos Atlanta Brazilian Jiu-Jitsu', '3101 Roswell Rd Suíte 120', 'Marietta', 'GA'),
    ('Borges Brazilian Jiu Jitsu', '2800 Canton Rd # 400', 'Marietta', 'GA'),
    ('10th planet Atlanta', '771 Shallowford Rd', 'Kennesaw', 'GA'),
    ('Sakura Jiu Jitsu', '1105 Parkside Ln Suite 1212', 'Woodstock', 'GA'),
    ('Gracie Barra Georgia', '5505 Bells Ferry Rd Suite 220', 'Acworth', 'GA'),
    ('Rise Up Brazilian Jiu Jitsu', '4290 Bells Ferry Rd Suite 146', 'Kennesaw', 'GA'),
    ('Campeão United Jiu-Jitsu Acworth', '3335 Cobb Pkwy NW', 'Acworth', 'GA'),
    ('Rolling Panda Brazilian Jiu Jitsu', '10 Sparks Dr', 'Hiram', 'GA'),
    ('KnuckleUp Academy', '7475 Douglas Blvd Suite 204', 'Douglasville', 'GA'),
    ('Hartsfield-Jackson Atlanta International Airport', '', 'Atlanta', 'GA');

    -- 3. Inserir academias e vinculá-las
    FOR v_academy_record IN SELECT * FROM temp_atlanta_academies LOOP
        -- Tentar inserir a academia e pegar o novo ID
        INSERT INTO academies (name, address, city, state, status)
        VALUES (v_academy_record.name, v_academy_record.address, v_academy_record.city, v_academy_record.state, 'ACTIVE')
        RETURNING id INTO v_new_academy_id;

        -- No caso onde o nome e endereço exatos já existam (caso a tabela tenha unique constraint),
        -- precisaríamos buscar o ID existente se o INSERT falhasse. 
        -- Mas considerando a sua modelagem, inseriremos e os duplicados podem ser agrupados depois se necessário.
        
        -- Vincular a academia criada/encontrada ao evento
        INSERT INTO event_academies (event_id, academy_id, is_active)
        VALUES (v_event_id, v_new_academy_id, true)
        ON CONFLICT (event_id, academy_id) DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Academias cadastradas e vinculadas com sucesso ao evento PBJJF Atlanta!';
END $$;
