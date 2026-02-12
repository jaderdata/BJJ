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

async function main() {
    const eventId = 'dbf9b15d-6c19-4e6a-95ee-9464dc1f7d26';
    const lines = rawVoucherData.trim().split('\n');

    console.log("🛠️ Processando lista de vouchers...");

    // 1. Coletar todas as academias únicas para limpeza
    const academyNames = [...new Set(lines.map(l => l.split('\t')[2].trim()))];

    for (const name of academyNames) {
        // Find Academy accurately
        const { data: academy } = await supabase.from('academies').select('id, name').ilike('name', name).limit(1).maybeSingle();
        if (!academy) {
            console.error(`❌ Academia não encontrada: "${name}"`);
            continue;
        }

        // Limpar vouchers que NÃO sejam os originais (limpeza de rascunhos)
        // Nota: Apenas limpamos se houver códigos que não batem com os fornecidos
        const { data: currentVouchers } = await supabase.from('vouchers').select('code').eq('academy_id', academy.id);
        const originalCodesForThis = lines.filter(l => l.split('\t')[2].trim() === name).map(l => l.split('\t')[0]);

        const toDelete = currentVouchers?.filter(v => !originalCodesForThis.includes(v.code)).map(v => v.code);

        if (toDelete && toDelete.length > 0) {
            console.log(`🧹 Limpando ${toDelete.length} vouchers temporários da academia ${academy.name}...`);
            await supabase.from('vouchers').delete().in('code', toDelete);
        }

        // Restaurar/Inserir os originais
        const vouchersForThis = lines.filter(l => l.split('\t')[2].trim() === name);

        for (const vData of vouchersForThis) {
            const [code, dateStr] = vData.split('\t');
            const [day, month, year] = dateStr.split('/');
            const date = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();

            // Achar ou Criar Visita
            let { data: visit } = await supabase.from('visits').select('id').eq('academy_id', academy.id).eq('event_id', eventId).limit(1).maybeSingle();

            if (!visit) {
                const { data: newV } = await supabase.from('visits').insert({
                    academy_id: academy.id,
                    event_id: eventId,
                    status: 'Visitada',
                    started_at: date,
                    finished_at: date,
                    summary: '[RESTAURAÇÃO] Visita criada para os vouchers originais.'
                }).select().single();
                visit = newV;
            }

            // Inserir Voucher se não existir
            const { data: exists } = await supabase.from('vouchers').select('code').eq('code', code).maybeSingle();
            if (!exists) {
                const { error } = await supabase.from('vouchers').insert({
                    code: code,
                    academy_id: academy.id,
                    event_id: eventId,
                    visit_id: visit.id,
                    created_at: date
                });
                if (!error) console.log(`✅ Restaurado: ${code} (${academy.name})`);
            } else {
                console.log(`ℹ️ Voucher ${code} já ok.`);
            }
        }
    }
    console.log("\nDone!");
}

main();
