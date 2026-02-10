import React, { useState, useMemo } from 'react';
import {
    CalendarDays, X, CheckCircle2, Clock, Plus, Minus, AlertCircle, ChevronRight, ChevronLeft,
    Ticket, Info, Bell, Search, Edit3, Camera, Trash2, RefreshCw, QrCode, Copy, ExternalLink,
    History, TrendingUp, MessageCircle, Phone, Save, Loader2, Play, Image as ImageIcon,
    Upload, Mic, Send, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import {
    User,
    UserRole,
    Academy,
    Event,
    EventStatus,
    Visit,
    VisitStatus,
    AcademyTemperature,
    ContactPerson,
    FinanceRecord,
    FinanceStatus,
    Voucher,
} from '../types';
import { DatabaseService } from '../lib/supabase';
import { cn, generateVoucherCode } from '../lib/utils';

export const AdminFinance: React.FC<{ finance: FinanceRecord[], setFinance: any, events: Event[], vendedores: User[], notifyUser: any }> = ({ finance, setFinance, events, vendedores, notifyUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [formRecord, setFormRecord] = useState<Partial<FinanceRecord>>({ status: FinanceStatus.PENDING });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLaunchOrEdit = async () => {
    if (!formRecord.eventId || !formRecord.salespersonId || !formRecord.amount) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedRecord) {
        const updatedPayload = {
          ...selectedRecord,
          ...formRecord,
          amount: Number(formRecord.amount),
          updatedAt: new Date().toISOString()
        };
        const updated = await DatabaseService.updateFinance(updatedPayload.id, updatedPayload);
        setFinance((prev: FinanceRecord[]) => prev.map(f => f.id === updated.id ? updated : f));

        const eventName = events.find(e => e.id === updated.eventId)?.name;
        notifyUser(updated.salespersonId, `Lançamento financeiro do evento "${eventName}" foi atualizado.`);
      } else {
        const payload: Partial<FinanceRecord> = {
          eventId: formRecord.eventId!,
          salespersonId: formRecord.salespersonId!,
          amount: Number(formRecord.amount),
          status: FinanceStatus.PENDING,
          updatedAt: new Date().toISOString(),
          observation: formRecord.observation
        };
        const created = await DatabaseService.createFinance(payload);
        setFinance((prev: FinanceRecord[]) => [created, ...prev]);

        const eventName = events.find(e => e.id === payload.eventId)?.name;
        notifyUser(payload.salespersonId!, `Novo lançamento financeiro no valor de $ ${payload.amount?.toFixed(2)} referente ao evento "${eventName}".`);
      }

      setShowModal(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error saving finance record:", error);
      alert("Erro ao salvar lançamento financeiro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord || !window.confirm("Tem certeza que deseja excluir este lançamento?")) return;

    setIsSubmitting(true);
    try {
      await DatabaseService.deleteFinance(selectedRecord.id);
      setFinance((prev: FinanceRecord[]) => prev.filter(f => f.id !== selectedRecord.id));
      setShowModal(false);
      setSelectedRecord(null);
    } catch (error: any) {
      console.error("Error deleting finance record:", error);
      alert("Erro ao excluir lançamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (e: React.MouseEvent, record: FinanceRecord) => {
    e.stopPropagation();
    if (!window.confirm("Confirmar que este pagamento foi efetuado?")) return;

    try {
      const updated = await DatabaseService.updateFinance(record.id, { ...record, status: FinanceStatus.PAID, updatedAt: new Date().toISOString() });
      setFinance((prev: FinanceRecord[]) => prev.map(f => f.id === record.id ? updated : f));

      const eventName = events.find(e => e.id === record.eventId)?.name;
      notifyUser(record.salespersonId, `Seu pagamento de $ ${record.amount.toFixed(2)} referente ao evento "${eventName}" foi realizado.`);
    } catch (error) {
      console.error("Error marking as paid:", error);
      alert("Erro ao atualizar status de pagamento.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-neutral-400">Controle de comissões.</p>
        <button onClick={() => { setSelectedRecord(null); setFormRecord({ status: FinanceStatus.PENDING }); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 shadow-lg hover:bg-emerald-700 transition-colors">
          <Plus size={18} strokeWidth={1.5} />
          <span>Lançar Pagamento</span>
        </button>
      </div>

      <div className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-900 border-b border-neutral-700">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Evento</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Vendedor</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Valor</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-neutral-400 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {finance.map(f => (
              <tr key={f.id} onClick={() => { setSelectedRecord(f); setFormRecord({ ...f }); setShowModal(true); }} className="text-sm hover:bg-neutral-700/50 cursor-pointer group">
                <td className="px-6 py-4 font-bold text-white relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-2/3 bg-neutral-500 transition-all rounded-r-full"></div>
                  {events.find(e => e.id === f.eventId)?.name}
                </td>
                <td className="px-6 py-4 text-neutral-300">{vendedores.find(v => v.id === f.salespersonId)?.name}</td>
                <td className="px-6 py-4 font-black text-white tabular-nums text-lg">$ {f.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${f.status === FinanceStatus.PENDING ? 'bg-amber-900/30 text-amber-400' :
                    f.status === FinanceStatus.PAID ? 'bg-neutral-900/30 text-neutral-400' : 'bg-emerald-900/30 text-emerald-400'
                    }`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="text-xs font-bold text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">Editar</span>
                    {f.status === FinanceStatus.PENDING && (
                      <button onClick={(e) => handleMarkAsPaid(e, f)} className="text-xs bg-white text-neutral-900 px-3 py-1.5 rounded-lg font-bold hover:bg-neutral-200 transition-colors">Marcar Pago</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 border border-neutral-700">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedRecord ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white"><X size={18} strokeWidth={1.5} /></button>
            </div>
            <div className="p-6 space-y-4">
              <select className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none" value={formRecord.eventId || ''} onChange={e => setFormRecord({ ...formRecord, eventId: e.target.value })}>
                <option value="">Evento</option>
                {events.map(e => <option key={e.id} value={e.id} className="bg-neutral-800">{e.name}</option>)}
              </select>
              <select className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none" value={formRecord.salespersonId || ''} onChange={e => setFormRecord({ ...formRecord, salespersonId: e.target.value })}>
                <option value="">Vendedor</option>
                {vendedores.map(v => <option key={v.id} value={v.id} className="bg-neutral-800">{v.name}</option>)}
              </select>
              <input type="number" step="0.01" className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none placeholder:text-neutral-400" placeholder="Valor" value={formRecord.amount || ''} onChange={e => setFormRecord({ ...formRecord, amount: Number(e.target.value) })} />
              <textarea
                className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-700 text-white focus:border-white outline-none placeholder:text-neutral-400 min-h-[100px]"
                placeholder="Observação"
                value={formRecord.observation || ''}
                onChange={e => setFormRecord({ ...formRecord, observation: e.target.value })}
              />

              <div className="flex gap-3 pt-2">
                {selectedRecord && (
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 bg-red-900/30 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-900/50 transition-colors border border-red-900/50 flex items-center justify-center disabled:opacity-50"
                  >
                    <Trash2 size={18} strokeWidth={1.5} className="mr-2" /> Excluir
                  </button>
                )}
                <button
                  onClick={handleLaunchOrEdit}
                  disabled={isSubmitting}
                  className={`flex-[2] bg-white text-neutral-900 py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <><RefreshCw className="animate-spin mr-2" size={18} strokeWidth={1.5} /> Salvando...</>
                  ) : (
                    selectedRecord ? 'Salvar Alterações' : 'Lançar Pagamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};





