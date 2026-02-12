import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envContent.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));
const supabase = createClient(env.VITE_SUPABASE_URL.trim(), env.VITE_SUPABASE_ANON_KEY.trim());

const rawVoucherData = `
JKH713	05/02/2026	Gracie Barra Lake Nona	Jader Dourado	YES
KVY384	05/02/2026	Gracie Barra Lake Nona	Jader Dourado	YES
JCW676	05/02/2026	Fabin Rosa Brazilian Jiu Jitsu Lake Nona	Jader Dourado	YES
ZZC363	05/02/2026	Fabin Rosa Brazilian Jiu Jitsu Lake Nona	Jader Dourado	YES
EVZ656	05/02/2026	Gracie Barra Orlando	Jader Dourado	YES
SBB573	05/02/2026	Gracie Barra Orlando	Jader Dourado	YES
MCD134	05/02/2026	Gracie Barra Orlando	Jader Dourado	YES
ZGK040	09/02/2026	Elevate Jiu Jitsu	Jader Dourado	YES
YNE367	09/02/2026	Elevate Jiu Jitsu	Jader Dourado	YES
KOZ607	09/02/2026	Elementum Jiu-jitsu - Winter Park	Jader Dourado	NO
CHR847	09/02/2026	Elementum Jiu-jitsu - Winter Park	Jader Dourado	NO
HOA443	09/02/2026	Elementum Jiu-jitsu - Winter Park	Jader Dourado	NO
JXA777	09/02/2026	MARTIAL ARTS NATION	Jader Dourado	YES
OEK850	09/02/2026	MARTIAL ARTS NATION	Jader Dourado	YES
TUB317	09/02/2026	Gracie Barra Hunters Creek	Jader Dourado	YES
BRV940	09/02/2026	Gracie Barra Hunters Creek	Jader Dourado	YES
KQZ110	09/02/2026	Gracie Barra Hunters Creek	Jader Dourado	YES
GUC490	09/02/2026	Checkmat Orlando Brazilian Jiu-Jitsu	Jader Dourado	YES
DLP520	09/02/2026	Checkmat Orlando Brazilian Jiu-Jitsu	Jader Dourado	YES
IVK720	09/02/2026	Checkmat Orlando Brazilian Jiu-Jitsu	Jader Dourado	YES
OFX515	10/02/2026	HARMONY BJJ	Jader Dourado	NO
RQM898	10/02/2026	HARMONY BJJ	Jader Dourado	NO
RPV169	10/02/2026	HARMONY BJJ	Jader Dourado	NO
TQO884	11/02/2026	Guto Campos Brazilian Jiu-Jitsu	Jader Dourado	NO
PKF670	11/02/2026	Guto Campos Brazilian Jiu-Jitsu	Jader Dourado	NO
NCF993	06/02/2026	Gracie Barra Kissimmee	Jader Dourado	YES
VVZ323	06/02/2026	Gracie Barra Kissimmee	Jader Dourado	YES
DZR462	06/02/2026	Gracie Barra Kissimmee	Jader Dourado	YES
GJR624	12/02/2026	SQUAD BRAZILIAN JIU JITSU	Jader Dourado	YES
NTO866	12/02/2026	SQUAD BRAZILIAN JIU JITSU	Jader Dourado	YES
XIV711	12/02/2026	Fabin Rosa Brazilian Jiu Jitsu Academy	Jader Dourado	YES
VSJ660	12/02/2026	Fabin Rosa Brazilian Jiu Jitsu Academy	Jader Dourado	YES
GUA135	12/02/2026	Fabin Rosa Brazilian Jiu Jitsu Academy	Jader Dourado	YES
`;

async function restoreSpecificVouchers() {
    const lines = rawVoucherData.trim().split('\n');
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26'; // Evento padrão (Spring Open 2026)

    console.log("🚀 Iniciando restauração de vouchers originais...");

    for (const line of lines) {
        const [code, dateStr, academyName, salesperson, retirado] = line.split('\t');

        // Converter data DD/MM/YYYY para ISO
        const [day, month, year] = dateStr.split('/');
        const date = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();

        // 1. Achar Academia
        const { data: academy } = await supabase.from('academies').select('id').eq('name', academyName.trim()).single();
        if (!academy) {
            console.error(`❌ Academia não encontrada: ${academyName}`);
            continue;
        }

        // 2. Achar ou Criar Visita para vincular o voucher
        // Tentamos achar uma visita daquela academia no evento
        let { data: visit } = await supabase.from('visits').select('id')
            .eq('academy_id', academy.id)
            .eq('event_id', eventId)
            .limit(1).maybeSingle();

        if (!visit) {
            // Se a visita sumiu, criamos uma nova "Visitada" para suportar o voucher
            console.log(`⚠️ Criando visita faltante para ${academyName}...`);
            const { data: newVisit, error: vError } = await supabase.from('visits').insert({
                academy_id: academy.id,
                event_id: eventId,
                status: 'Visitada',
                started_at: date,
                finished_at: date,
                summary: '[RESTAURAÇÃO VOUCHERS] Visita recriada para suportar códigos originais.'
            }).select().single();

            if (vError) {
                console.error(`❌ Erro ao recriar visita para ${academyName}:`, vError.message);
                continue;
            }
            visit = newVisit;
        }

        // 3. Verificar se o voucher já existe para evitar duplicatas
        const { data: existing } = await supabase.from('vouchers').select('code').eq('code', code).maybeSingle();

        if (existing) {
            console.log(`ℹ️ Voucher ${code} já existe. Pulando.`);
            continue;
        }

        // 4. Inserir o Voucher Original
        const { error: voError } = await supabase.from('vouchers').insert({
            code: code,
            academy_id: academy.id,
            event_id: eventId,
            visit_id: visit.id,
            created_at: date
        });

        if (voError) {
            console.error(`❌ Erro ao inserir voucher ${code}:`, voError.message);
        } else {
            console.log(`✅ Voucher ${code} restaurado para ${academyName}.`);
        }
    }

    console.log("\n✨ Processo de restauração de vouchers originais concluído!");
}

restoreSpecificVouchers();
