
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const DebugMudita: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const fetchDiagnosis = async () => {
        setLoading(true);
        addLog("Iniciando diagnóstico...");
        try {
            // 1. Buscar Academia
            const { data: academies, error: acError } = await supabase
                .from('academies')
                .select('*')
                .ilike('name', '%MUDITA%');

            if (acError) throw acError;
            if (!academies?.length) {
                addLog("❌ Academia MUDITA não encontrada!");
                return;
            }

            const academy = academies[0];
            addLog(`✅ Academia encontrada: ${academy.name} (${academy.id})`);

            // 2. Buscar Visitas
            const { data: visits, error: vError } = await supabase
                .from('visits')
                .select('*')
                .eq('academy_id', academy.id);

            if (vError) throw vError;
            addLog(`✅ Visitas encontradas: ${visits?.length || 0}`);

            // 3. Buscar Vouchers
            const { data: vouchers, error: voError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('academy_id', academy.id);

            if (voError) throw voError;
            addLog(`✅ Vouchers encontrados: ${vouchers?.length || 0}`);

            setData({ academy, visits, vouchers });

        } catch (error: any) {
            addLog(`❌ Erro no diagnóstico: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fixVisit = async () => {
        if (!data?.academy || !data?.visits?.[0]) {
            addLog("⚠️ Não é possível corrigir: Dados incompletos.");
            return;
        }

        setLoading(true);
        addLog("🛠️ Tentando corrigir visita...");

        try {
            const visit = data.visits[0];

            // 1. Forçar status VISITED
            if (visit.status !== 'VISITED') {
                const { error: updateError } = await supabase
                    .from('visits')
                    .update({ status: 'VISITED', finished_at: new Date().toISOString() })
                    .eq('id', visit.id);

                if (updateError) throw updateError;
                addLog("✅ Status atualizado para VISITED.");
            } else {
                addLog("ℹ️ Status já é VISITED.");
            }

            // 2. Recriar Vouchers se faltarem
            // Códigos fornecidos pelo usuário: VRJ103, PSX622
            const correctVouchers = ['VRJ103', 'PSX622'];

            // Se a visita não tem vouchers_generated ou eles diferem, vamos forçar os corretos
            if (visit.vouchers_generated?.sort().toString() !== correctVouchers.sort().toString()) {
                const { error: updateVisitError } = await supabase
                    .from('visits')
                    .update({ vouchers_generated: correctVouchers })
                    .eq('id', visit.id);

                if (updateVisitError) throw updateVisitError;
                addLog("✅ Lista de vouchers na visita atualizada.");
            }

            if (!data.vouchers?.length) {
                addLog(`⚠️ Vouchers sumiram do banco! Recriando ${correctVouchers.length} vouchers...`);

                const vouchersToInsert = correctVouchers.map((code: string) => ({
                    code,
                    academy_id: data.academy.id,
                    visit_id: visit.id,
                    status: 'ACTIVE',
                    created_at: new Date().toISOString()
                }));

                const { error: insertError } = await supabase
                    .from('vouchers')
                    .insert(vouchersToInsert);

                if (insertError) throw insertError;
                addLog("✅ Vouchers recriados com sucesso!");
            } else {
                addLog("ℹ️ Vouchers parecem ok ou lista vazia.");
            }

            await fetchDiagnosis(); // Recarregar
            addLog("✨ Correção concluída!");

        } catch (error: any) {
            addLog(`❌ Erro ao corrigir: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiagnosis();
    }, []);

    return (
        <div className="p-8 bg-neutral-900 min-h-screen text-white font-mono">
            <h1 className="text-2xl font-bold mb-6 text-red-500 flex items-center gap-2">
                <AlertTriangle /> Diagnóstico de Emergência: Mudita
            </h1>

            <div className="grid gap-6">
                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                    <h2 className="text-lg font-bold mb-2 text-emerald-400">Estado Atual</h2>
                    {loading ? (
                        <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="animate-spin" /> Carregando...</div>
                    ) : data ? (
                        <pre className="text-xs bg-black p-4 rounded overflow-auto max-h-60">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-neutral-500">Sem dados.</p>
                    )}
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                    <h2 className="text-lg font-bold mb-2 text-sky-400">Ações</h2>
                    <div className="flex gap-4">
                        <button onClick={fetchDiagnosis} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded flex items-center gap-2">
                            <RefreshCw size={16} /> Atualizar
                        </button>
                        <button onClick={fixVisit} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded flex items-center gap-2 font-bold">
                            <CheckCircle2 size={16} /> Corrigir Visita & Vouchers
                        </button>
                    </div>
                </div>

                <div className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                    <h2 className="text-lg font-bold mb-2 text-neutral-400">Logs</h2>
                    <div className="font-mono text-xs space-y-1 max-h-60 overflow-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="border-b border-neutral-700/50 pb-1">{log}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
