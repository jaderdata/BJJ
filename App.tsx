
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarDays,
  X,
  CheckCircle2,
  Clock,
  Plus,
  Minus,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Ticket,
  Info,
  Bell,
  Search,
  Edit3,
  Camera,
  Trash2,
  RefreshCw,
  QrCode,
  Copy,
  ExternalLink,
  History,
  TrendingUp,
  MessageCircle,
  Phone,
  Save,
  Loader2,
  Play,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
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
} from './types';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import CustomAuth from './components/CustomAuth';
import { ProgressBar } from './components/ProgressBar';
import { AdminDashboard } from './components/AdminDashboard';
import { Reports } from './components/Reports';
import { EventsManager } from './components/EventsManager';
import { AcademiesManager } from './components/AcademiesManager';
import { UsersManager } from './components/UsersManager';
import { SalesFinance } from './components/SalesFinance';
import ElevationPrompt from './components/ElevationPrompt';
import AdminModeIndicator from './components/AdminModeIndicator';
import { ElevationProvider, useElevation } from './contexts/ElevationContext';
import { supabase, DatabaseService, AuthService } from './lib/supabase';
import { cn, generateVoucherCode } from './lib/utils';
import { toast, Toaster } from 'sonner';


interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  timestamp: string;
}

// --- COMPONENTE PÚBLICO DE LANDING PAGE DE VOUCHERS ---
const PublicVoucherLanding: React.FC<{ academyName: string, codes: string[], createdAt: number }> = ({ academyName, codes, createdAt }) => {
  const [copied, setCopied] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // Settings State
  const [redemptionPhone, setRedemptionPhone] = useState('4076339166'); // Default fallback
  const [loadingPhone, setLoadingPhone] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const phone = await DatabaseService.getSetting('voucher_redemption_phone');
        if (phone) {
          // remove quotes if stored as json string and non-digits
          let clean = String(phone).replace(/"/g, '').replace(/\D/g, '');
          // Fallback valid format check - if empty after clean, stick to default?
          // Assuming admin saves valid phone.
          if (clean && clean.length >= 10) setRedemptionPhone(clean);
        }
      } catch (err) {
        // Silently fail and use default phone - this is a public page
        console.log('Using default redemption phone (public access)');
      } finally {
        setLoadingPhone(false);
      }
    };
    fetchSettings();
  }, []);

  const now = Date.now();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
  const isExpired = createdAt > 0 && (now - createdAt > expirationTime);

  const getMessageBody = () => {
    return `PBJJF Voucher Redemption\n\nAcademy: ${academyName}\nVouchers: ${codes.join(', ')}\n\nPlease confirm receipt and processing.`;
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getMessageBody());
    window.open(`https://wa.me/1${redemptionPhone}?text=${text}`, '_blank');
  };

  const handleSMS = () => {
    const body = encodeURIComponent(getMessageBody());
    window.location.href = `sms:1${redemptionPhone}?body=${body}`; // Assuming US Country Code 1 for simplicity based on fallback, can be improved later
  };

  // Legacy copy logic kept but hidden or repurposed? User said "remover a instrucao de retirada".
  // Keeping just the copy codes logic if they want to share manually.
  const contentToCopy = `Academy: ${academyName}\nVouchers: ${codes.join(', ')}\n\nRedeem at: (407) 633-9166`; // Updated to be generic

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isClosed) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="bg-neutral-800 border border-neutral-700 max-w-md w-full p-10 rounded-[2rem] space-y-4 shadow-2xl">
          <div className="text-emerald-500 font-black text-4xl mb-4 animate-bounce">OSS!</div>
          <h1 className="text-2xl font-black text-white">Vouchers Saved!</h1>
          <p className="text-neutral-400">You can now close this screen.</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="bg-neutral-800 border border-neutral-700 max-w-md w-full p-10 rounded-[2rem] space-y-4 shadow-2xl">
          <div className="bg-red-500/20 text-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto"><Clock size={32} /></div>
          <h1 className="text-2xl font-black text-white">Expired Link</h1>
          <p className="text-neutral-400">This voucher link expired after 24 hours for security reasons. Please request a new code from your representative.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Header */}
        <div className="pt-12 pb-8 flex flex-col items-center space-y-4 px-6 text-center w-full">
          <div className="w-48 h-20 flex items-center justify-center mb-2">
            <img src="/PBJJF_logo.jpeg" alt="PBJJF" className="h-full w-auto opacity-90" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">PBJJF Vouchers</h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] leading-relaxed max-w-xs">{academyName}</p>
        </div>

        <div className="w-full h-px bg-white/5 mx-auto max-w-xs"></div>

        <div className="p-8 md:p-10 w-full space-y-10">
          <div className="space-y-8 text-center">
            <h2 className="text-xl font-bold text-white leading-snug px-4">
              Thank you for being part of the upcoming PBJJF event! 🥋
            </h2>

            {/* Voucher Box */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 space-y-6">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Vouchers</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {codes.map((c, i) => (
                  <div key={i} className="bg-black/40 border border-white/10 text-white px-8 py-4 rounded-2xl font-mono font-black text-xl md:text-2xl shadow-inner uppercase">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-center text-[10px] font-bold text-neutral-500 italic">
              Click below to redeem your vouchers instantly:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={24} fill="currentColor" className="text-white/20" />
                  <span className="text-lg">WhatsApp</span>
                </div>
              </button>
              <button
                onClick={handleSMS}
                className="bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={24} />
                  <span className="text-lg">Send SMS</span>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <p className="text-center text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
              Manual Options
            </p>
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center space-x-2 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${copied ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-900 hover:bg-neutral-200'
                }`}
            >
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Link Copied!' : 'Copy Instructions & Codes'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full bg-black/30 p-8 border-t border-white/5 space-y-6">
          <div className="flex justify-center items-center space-x-2 text-[8px] md:text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
            <span>Expires in 24 hours</span>
            <span className="text-white/10">•</span>
            <span>Secure BJJVisits Token</span>
          </div>

          <button
            onClick={() => setIsClosed(true)}
            className="w-full flex items-center justify-center space-x-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
          >
            <X size={14} />
            <span>Close Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};










const EventDetailAdmin: React.FC<{ event: Event, academies: Academy[], visits: Visit[], vendedores: User[], onBack: any, onUpdateEvent: any, notifyUser: (uid: string, msg: string) => void }> = ({ event, academies, visits, vendedores, onBack, onUpdateEvent, notifyUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({ ...event });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(event.photoUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const eventAcademies = academies.filter(a => event.academiesIds.includes(a.id));

  const finishedVisitIds = visits.filter(v => v.eventId === event.id && v.status === VisitStatus.VISITED).map(v => v.academyId);
  const pendingAcademies = eventAcademies.filter(a => !finishedVisitIds.includes(a.id));
  const finishedAcademies = eventAcademies.filter(a => finishedVisitIds.includes(a.id));

  // Available = not in event AND matches search AND matches filters
  const availableAcademies = useMemo(() => {
    return academies.filter(a => {
      const isLinked = event.academiesIds.includes(a.id);
      if (isLinked) return false;

      const matchesSearch = !searchTerm ||
        (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.responsible?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (a.phone || '').includes(searchTerm);

      const matchesCity = !cityFilter || a.city === cityFilter;
      const matchesState = !stateFilter || a.state === stateFilter;

      return matchesSearch && matchesCity && matchesState;
    });
  }, [academies, event.academiesIds, searchTerm, cityFilter, stateFilter]);

  // Unique filters for the modal
  const modalCities = useMemo(() => Array.from(new Set(academies.filter(a => !event.academiesIds.includes(a.id)).map(a => a.city).filter(Boolean))).sort(), [academies, event.academiesIds]);
  const modalStates = useMemo(() => Array.from(new Set(academies.filter(a => !event.academiesIds.includes(a.id)).map(a => a.state).filter(Boolean))).sort(), [academies, event.academiesIds]);

  const handleBulkLink = () => {
    if (selectedIds.length === 0) return;
    // Garantir IDs únicos para evitar duplicidade acidental no estado local
    const newAcademiesIds = Array.from(new Set([...event.academiesIds, ...selectedIds]));
    onUpdateEvent({ ...event, academiesIds: newAcademiesIds });
    toast.success(`${selectedIds.length} academia(s) vinculada(s) com sucesso!`);
    setSelectedIds([]);
    setShowAddModal(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleRemoveAcademy = (academyId: string) => {
    const academy = academies.find(a => a.id === academyId);
    if (window.confirm(`Deseja remover "${academy?.name}" deste evento?`)) {
      onUpdateEvent({ ...event, academiesIds: event.academiesIds.filter(id => id !== academyId) });
      toast.success(`Academia "${academy?.name}" removida do evento.`);
    }
  };

  const handleSalespersonChange = (newSalespersonId: string) => {
    const oldSalespersonId = event.salespersonId;
    const newSalesperson = vendedores.find(v => v.id === newSalespersonId);
    const oldSalesperson = vendedores.find(v => v.id === oldSalespersonId);

    onUpdateEvent({ ...event, salespersonId: newSalespersonId || undefined });

    if (newSalespersonId && newSalespersonId !== oldSalespersonId) {
      notifyUser(newSalespersonId, `Você foi atribuído ao evento "${event.name}".`);
      toast.success(`Vendedor "${newSalesperson?.name}" atribuído ao evento.`);
    } else if (!newSalespersonId && oldSalespersonId) {
      toast.info('Vendedor removido do evento.');
    }

    if (oldSalespersonId && oldSalespersonId !== newSalespersonId) {
      notifyUser(oldSalespersonId, `Você não é mais o responsável pelo evento "${event.name}".`);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB.');
        return;
      }
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Foto selecionada com sucesso!');
    }
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(event.photoUrl || null);
    toast.info('Foto removida. A foto original será mantida se você não selecionar outra.');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name || !editForm.address || !editForm.city || !editForm.state || !editForm.startDate || !editForm.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Salvando alterações...');

    try {
      let photoUrl = editForm.photoUrl;

      // Upload new photo if selected
      if (selectedPhoto) {
        photoUrl = await DatabaseService.uploadEventPhoto(selectedPhoto);
        // Delete old photo if exists and is different
        if (event.photoUrl && event.photoUrl !== photoUrl) {
          await DatabaseService.deleteEventPhoto(event.photoUrl);
        }
      }

      await onUpdateEvent({ ...editForm, photoUrl });
      toast.success('Evento atualizado com sucesso!', { id: loadingToast });
      setIsEditing(false);
      setSelectedPhoto(null);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(`Erro ao atualizar evento: ${error.message}`, { id: loadingToast });
    }
  };

  const handleFinishVisitFromAdmin = async (visit: Visit) => {
    if (!visit.contactPerson || !visit.temperature) {
      toast.error("A visita precisa ter informações básicas preenchidas (contato e temperatura).");
      return;
    }

    try {
      const updatedVisit = {
        ...visit,
        status: VisitStatus.VISITED,
        finishedAt: new Date().toISOString() // Sempre captura horário atual
      };

      await DatabaseService.upsertVisit(updatedVisit);
      toast.success('Visita finalizada com sucesso!');

      // Atualizar a lista de visitas localmente
      onUpdateEvent({ ...event }); // Trigger reload
      setSelectedVisit(null);
    } catch (error: any) {
      console.error('Error finishing visit:', error);
      toast.error(`Erro ao finalizar visita: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="flex items-center text-neutral-500 font-bold hover:underline transition-all hover:text-neutral-400">
          <ChevronLeft size={18} strokeWidth={1.5} className="mr-1" /> Voltar para Eventos
        </button>
        {!isEditing && (
          <button
            onClick={() => { setEditForm({ ...event }); setIsEditing(true); }}
            className="flex items-center space-x-2 bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Edit3 size={16} strokeWidth={1.5} />
            <span>Editar Informações</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-neutral-800 p-8 rounded-3xl border border-neutral-700 shadow-sm">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Nome do Evento</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Endereço</label>
                  <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Cidade</label>
                  <input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">UF</label>
                  <input type="text" maxLength={2} value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value.toUpperCase() })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Data Início</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Data Fim</label>
                  <input type="date" value={editForm.endDate} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as EventStatus })} className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-xl text-white outline-none focus:border-white">
                    {Object.values(EventStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Photo Upload Section */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase ml-1 mb-2 block">
                    Foto do Evento
                  </label>

                  {photoPreview ? (
                    <div className="relative w-full h-64 bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden group">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center space-x-2 transition-all cursor-pointer">
                          <Upload size={16} />
                          <span>Alterar Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center space-x-2 transition-all"
                        >
                          <Trash2 size={16} />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center justify-center px-4 py-12 bg-neutral-900 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:bg-neutral-800 hover:border-neutral-600 transition-all group">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="p-3 bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                          <ImageIcon size={32} className="text-blue-400" strokeWidth={2} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Upload size={16} className="text-neutral-400" />
                          <span className="text-sm font-bold text-neutral-300">Clique para adicionar foto</span>
                        </div>
                        <span className="text-xs text-neutral-500">PNG, JPG ou WEBP (máx. 5MB)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="md:col-span-2 flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 bg-white hover:bg-neutral-200 text-neutral-900 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>Salvar Alterações</span>
                    )}
                  </button>
                  <button type="button" onClick={() => { setIsEditing(false); setSelectedPhoto(null); setPhotoPreview(event.photoUrl || null); }} className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-xl font-bold transition-all">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-900/50 px-2 py-1 rounded-full">{event.status}</span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center">
                      {event.startDate === event.endDate
                        ? new Date(event.startDate).toLocaleDateString('pt-BR')
                        : `${new Date(event.startDate).toLocaleDateString('pt-BR')} - ${new Date(event.endDate).toLocaleDateString('pt-BR')}`
                      }
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white mt-2">{event.name}</h3>
                  <p className="text-neutral-400 flex items-center font-medium mt-1">
                    {event.city} - {event.state}
                  </p>
                </div>
                <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 text-center">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Academias</p>
                  <p className="text-2xl font-black text-white tabular-nums">{event.academiesIds.length}</p>
                </div>
              </div>
            )}

            <div className="border-t border-neutral-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Academias Vinculadas</h4>
                <button
                  onClick={() => { setSelectedIds([]); setShowAddModal(true); }}
                  className="bg-white hover:bg-neutral-200 text-neutral-900 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg flex items-center transition-all shadow-lg active:scale-95"
                >
                  <Plus size={14} strokeWidth={1.5} className="mr-1.5" /> Adicionar Academia
                </button>
              </div>
              <div className="space-y-6">
                {/* Academias Pendentes */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                    Academias Pendentes ({pendingAcademies.length})
                  </h4>
                  <div className="bg-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden">
                    <div className="divide-y divide-neutral-800">
                      {pendingAcademies.length > 0 ? pendingAcademies.map(a => (
                        <div
                          key={a.id}
                          className="p-4 flex justify-between items-center bg-neutral-800 hover:bg-neutral-700 transition-colors"
                        >
                          <div>
                            <p className="font-bold text-white text-sm">{a.name}</p>
                            <p className="text-[10px] text-neutral-400">{a.city} - Resp: {a.responsible}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Pendente</span>
                            <button
                              onClick={() => handleRemoveAcademy(a.id)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Remover Vinculo"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 text-center text-neutral-500 text-xs italic">Nenhuma academia pendente.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academias Concluídas */}
                {finishedAcademies.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                      Academias Concluídas ({finishedAcademies.length})
                    </h4>
                    <div className="bg-neutral-900 rounded-2xl border border-neutral-700 overflow-hidden">
                      <div className="divide-y divide-neutral-800">
                        {finishedAcademies.map(a => {
                          const visit = visits.find(v => v.academyId === a.id && v.eventId === event.id);
                          return (
                            <div
                              key={a.id}
                              onClick={() => visit && setSelectedVisit(visit)}
                              className="p-4 flex justify-between items-center bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-white text-sm">{a.name}</p>
                                <p className="text-[10px] text-neutral-400">{a.city} - Resp: {a.responsible}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                {visit && (
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-900/30 text-red-400' : 'bg-neutral-900/30 text-neutral-400'}`}>{visit.temperature}</span>
                                    <span className="bg-emerald-900/30 text-emerald-400 p-1 rounded-full px-2 py-1 font-bold text-[10px]">OK</span>
                                  </div>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveAcademy(a.id); }}
                                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Remover Vinculo"
                                >
                                  <Trash2 size={14} strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-neutral-800 p-6 rounded-3xl border border-neutral-700 shadow-sm space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center">
                Vendedor Responsável
              </h4>
              <p className="text-[10px] text-neutral-400 mb-3 italic">Defina quem executará as visitas</p>

              <select
                value={event.salespersonId || ''}
                onChange={(e) => handleSalespersonChange(e.target.value)}
                className="w-full border border-neutral-600 p-3 rounded-xl bg-neutral-900 focus:bg-neutral-800 outline-none focus:ring-2 focus:ring-white transition-all font-bold text-white"
              >
                <option value="">Nenhum Atribuído</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id} className="bg-neutral-800">{v.name}</option>
                ))}
              </select>

              <div className="mt-4 p-3 bg-neutral-900/30 border border-neutral-800/50 rounded-xl">
                <div className="flex items-start space-x-2">
                  <Info size={14} strokeWidth={1.5} className="text-neutral-400 mt-0.5" />
                  <p className="text-[10px] text-neutral-300 leading-relaxed font-medium">
                    Ao alterar o vendedor, ele receberá uma notificação instantânea e o evento passará a aparecer em seu dashboard exclusivo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-neutral-700 overflow-hidden flex flex-col h-[85vh]">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-800/50">
              <div>
                <h3 className="text-xl font-bold text-white">Vincular Academias</h3>
                <p className="text-xs text-neutral-400 mt-1 flex items-center">
                  <Info size={14} strokeWidth={1.5} className="mr-1" /> Selecione as academias e clique em Vincular Selecionadas.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 bg-neutral-900/40 border-b border-neutral-700 space-y-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-neutral-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome, responsável ou telefone..."
                  className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="bg-neutral-900 border border-neutral-700 rounded-xl text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 text-xs font-semibold"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="">Cidades</option>
                  {modalCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="bg-neutral-900 border border-neutral-700 rounded-xl text-white px-3 py-2 outline-none focus:ring-2 focus:ring-white/50 text-xs font-semibold"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option value="">Estados</option>
                  {modalStates.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-neutral-900/20">
              {availableAcademies.length > 0 ? (
                availableAcademies.map(a => {
                  const isSelected = selectedIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleSelection(a.id)}
                      className={`w-full p-4 flex items-center bg-neutral-800/50 border transition-all rounded-2xl group text-left ${isSelected ? 'border-white bg-neutral-900/20 ring-1 ring-white' : 'border-neutral-700 hover:border-neutral-500'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-lg mr-4 flex items-center justify-center transition-all ${isSelected ? 'bg-white text-neutral-900' : 'bg-neutral-900 border border-neutral-600 text-transparent'
                        }`}>
                        <CheckCircle2 size={16} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold transition-colors ${isSelected ? 'text-neutral-400' : 'text-white'}`}>{a.name}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-neutral-400 mt-0.5">
                          <span className="bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-300 font-bold uppercase">{a.state}</span>
                          <span>{a.city}</span>
                          {a.responsible && <span>• Resp: {a.responsible}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="bg-neutral-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-neutral-700 text-opacity-30 font-bold">
                    ?
                  </div>
                  <p className="text-neutral-500 font-medium">Nenhuma academia disponível com estes critérios.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-neutral-800/80 border-t border-neutral-700 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                {selectedIds.length} selecionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={selectedIds.length === 0}
                  onClick={handleBulkLink}
                  className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg ${selectedIds.length > 0
                    ? 'bg-white text-neutral-900 hover:bg-neutral-200 active:scale-95'
                    : 'bg-neutral-700 text-neutral-500 cursor-not-allowed text-opacity-50'
                    }`}
                >
                  <Plus size={18} />
                  <span>Vincular Selecionadas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[120]">
          <div className="bg-neutral-800 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-neutral-900/30">
              <div>
                <h3 className="text-xl font-bold text-white">Detalhes da Visita</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {academies.find(a => a.id === selectedVisit.academyId)?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Status</p>
                  <span className="text-sm font-bold text-emerald-400 flex items-center">
                    {selectedVisit.status}
                  </span>
                </div>
                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Temperatura</p>
                  <span className={`text-sm font-bold flex items-center ${selectedVisit.temperature === AcademyTemperature.HOT ? 'text-red-400' : 'text-neutral-400'}`}>
                    {selectedVisit.temperature}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50">
                <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Conversa com</p>
                <span className="text-sm font-bold text-white">
                  {selectedVisit.contactPerson || 'Não informado'}
                </span>
              </div>

              {/* Materiais de Marketing */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Materiais Deixados</p>
                <div className="flex gap-3">
                  <div className={`flex-1 p-3 rounded-xl border flex items-center space-x-2 ${selectedVisit.leftBanner ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-neutral-900/30 border-neutral-800 text-neutral-600'}`}>
                    <span>🚩</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Banner</span>
                  </div>
                  <div className={`flex-1 p-3 rounded-xl border flex items-center space-x-2 ${selectedVisit.leftFlyers ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-neutral-900/30 border-neutral-800 text-neutral-600'}`}>
                    <span>📄</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Flyers</span>
                  </div>
                </div>
              </div>

              {/* Resumo da Visita */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Resumo da Visita</p>
                <div className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-700/50 text-sm text-neutral-300 leading-relaxed italic">
                  {selectedVisit.summary || selectedVisit.notes || 'Nenhum resumo registrado.'}
                </div>
              </div>

              {/* Fotos da Visita */}
              {selectedVisit.photos && selectedVisit.photos.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1 text-sky-400">Fotos do Local</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedVisit.photos.map((photo, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-white/5 shadow-lg group relative">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                        <a href={photo} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink size={14} className="text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedVisit.vouchersGenerated && selectedVisit.vouchersGenerated.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-neutral-500 uppercase ml-1">Vouchers Gerados ({selectedVisit.vouchersGenerated.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedVisit.vouchersGenerated.map(code => (
                      <span key={code} className="bg-neutral-900/30 text-neutral-400 px-3 py-1.5 rounded-lg border border-neutral-800/50 font-mono font-bold text-xs uppercase shadow-sm">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-700 flex justify-between items-center">
                <div className="text-[10px] text-neutral-500 font-medium">
                  <p>Início: {selectedVisit.startedAt ? new Date(selectedVisit.startedAt).toLocaleString('pt-BR') : '---'}</p>
                  <p>Fim: {selectedVisit.finishedAt ? new Date(selectedVisit.finishedAt).toLocaleString('pt-BR') : '---'}</p>
                </div>
                <div className="flex space-x-3">
                  {selectedVisit.status !== VisitStatus.VISITED && (
                    <button
                      onClick={() => handleFinishVisitFromAdmin(selectedVisit)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-lg"
                    >
                      Finalizar Visita
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVisit(null)}
                    className="bg-neutral-700 hover:bg-neutral-600 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminFinance: React.FC<{ finance: FinanceRecord[], setFinance: any, events: Event[], vendedores: User[], notifyUser: any }> = ({ finance, setFinance, events, vendedores, notifyUser }) => {
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





const SalespersonEvents: React.FC<{ events: Event[], academies: Academy[], visits: Visit[], notifications: any, onDismissNotif: any, onSelectAcademy: any, currentUserId: string }> = ({ events, academies, visits, notifications, onDismissNotif, onSelectAcademy, currentUserId }) => {
  // Calculate global progress for the salesperson
  const totalAcademies = events.reduce((acc, e) => acc + (e.academiesIds?.length || 0), 0);

  // completedVisitsCount should be the count of unique assignments that have been visited
  const completedVisitsCount = events.reduce((acc, e) => {
    const visitedInEvent = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
    const uniqueVisitedIds = new Set(visitedInEvent.map(v => v.academyId));
    // Somente contamos academias que realmente fazem parte deste evento
    const validVisitedCount = Array.from(uniqueVisitedIds).filter(aid => e.academiesIds.includes(aid)).length;
    return acc + validVisitedCount;
  }, 0);

  // Check for active/pending visits for this user
  const activeVisit = visits.find(v => v.salespersonId === currentUserId && v.status === VisitStatus.PENDING);
  const isOverdue = activeVisit && activeVisit.startedAt && (Date.now() - new Date(activeVisit.startedAt).getTime() > 3600000); // 1 hour

  const handleAcademyClick = (eventId: string, academyId: string) => {
    // Rule: Cannot start/open another visit if one is already pending (unless it's the same one)
    if (activeVisit) {
      if (activeVisit.academyId !== academyId || activeVisit.eventId !== eventId) {
        alert("Você já tem uma visita em andamento! Por favor, finalize a visita atual antes de iniciar outra.");
        return;
      }
    }
    onSelectAcademy(eventId, academyId);
  };

  return (
    <div className="space-y-6 pb-20"> {/* pb-20 to ensure content is above bottom nav */}

      {/* Alert for Overdue Visit */}
      {isOverdue && (
        <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="bg-red-500/20 p-2 rounded-full">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <div>
              <h4 className="font-bold text-red-500 text-lg">Visita Excedeu 1 Hora!</h4>
              <p className="text-red-400 text-sm mt-1">
                Sua visita na academia <span className="font-black">{academies.find(a => a.id === activeVisit.academyId)?.name}</span> está aberta há muito tempo.
              </p>
              <p className="text-red-300 text-xs mt-2 font-bold uppercase tracking-wider">
                Por favor, finalize a visita agora.
              </p>
              <button
                onClick={() => handleAcademyClick(activeVisit.eventId, activeVisit.academyId)}
                className="mt-3 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors"
              >
                Ir para Visita
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-neutral-800 p-4 rounded-2xl border border-neutral-700 shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Seu Progresso de Visitas</h3>
        <ProgressBar total={totalAcademies} completed={completedVisitsCount} />
      </div>

      {events.map(e => {
        const allAcademies = e.academiesIds.map(aid => academies.find(a => a.id === aid)).filter(Boolean) as Academy[];
        const completedIds = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED).map(v => v.academyId);
        const pendingAcademies = allAcademies.filter(a => !completedIds.includes(a.id));
        const finishedAcademies = allAcademies.filter(a => completedIds.includes(a.id));

        return (
          <div key={e.id} className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden shadow-sm">
            <div className="bg-neutral-950 p-4 text-white font-bold flex items-center justify-between">
              <div className="flex items-center">
                <span className="truncate max-w-[200px]">{e.name}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${e.status === EventStatus.IN_PROGRESS ? 'bg-emerald-900/30 text-emerald-400' : 'bg-neutral-800 text-neutral-300'}`}>
                {e.status === EventStatus.IN_PROGRESS ? 'ATIVO' : e.status}
              </span>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                  <span className="mr-1">Pendentes</span>
                  <span className="bg-neutral-700 text-white px-1.5 py-0.5 rounded text-[10px]">{pendingAcademies.length}</span>
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {pendingAcademies.map(a => {
                    // Check if this specific academy is the active one
                    const isActive = activeVisit?.academyId === a.id && activeVisit?.eventId === e.id;

                    return (
                      <div key={a.id} onClick={() => handleAcademyClick(e.id, a.id)} className={`p-4 flex justify-between items-center bg-neutral-700/30 rounded-xl active:bg-neutral-700 active:scale-[0.98] cursor-pointer group transition-all border ${isActive ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-900/10' : 'border-neutral-700 hover:border-neutral-500'}`}>
                        <div className="flex items-center space-x-3 w-full">
                          <div className={`p-2.5 rounded-xl shrink-0 font-bold text-xs uppercase ${isActive ? 'bg-emerald-500 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                            {isActive ? 'ABERTA' : 'ACAD'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-white text-sm truncate">{a.name}</p>
                            <p className="text-xs text-neutral-400 truncate">{a.city} • <span className="text-neutral-500">{a.responsible}</span></p>
                            {isActive && <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 animate-pulse">Visita em Andamento</p>}
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-500 shrink-0" />
                      </div>
                    );
                  })}
                  {pendingAcademies.length === 0 && <p className="text-center text-xs text-neutral-500 italic py-2">Nenhuma academia pendente neste evento.</p>}
                </div>
              </div>

              {finishedAcademies.length > 0 && (
                <div className="pt-4 border-t border-neutral-700">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
                    <span className="mr-1">Concluídas</span>
                    <span className="bg-emerald-900/30 text-emerald-500 px-1.5 py-0.5 rounded text-[10px]">{finishedAcademies.length}</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {finishedAcademies.map(a => {
                      const visit = visits.find(v => v.eventId === e.id && v.academyId === a.id);
                      return (
                        <div key={a.id} onClick={() => handleAcademyClick(e.id, a.id)} className="p-3 flex justify-between items-center bg-neutral-800/50 rounded-xl border border-neutral-800">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="p-1.5 rounded-lg bg-emerald-900/10 text-emerald-600/50 font-bold text-[10px]">
                              OK
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-sm opacity-50 truncate">{a.name}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                {visit?.temperature && (
                                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${visit.temperature === AcademyTemperature.HOT ? 'bg-red-900/20 text-red-500/70' : 'bg-neutral-900/30 text-neutral-600'}`}>
                                    {visit.temperature}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Spacer for bottom nav */}
      <div className="h-12"></div>
    </div>
  );
};

const VisitDetail: React.FC<{ eventId: string, academy: Academy, event: Event, existingVisit?: Visit, onFinish: any, onStart: any, onCancel: any }> = ({ eventId, academy, event, existingVisit, onFinish, onStart, onCancel }) => {
  const [step, setStep] = useState<'START' | 'ACTIVE' | 'VOUCHERS' | 'QR_CODE' | 'SUMMARY'>(
    existingVisit
      ? (existingVisit.status === VisitStatus.VISITED ? 'SUMMARY' : 'ACTIVE')
      : 'START'
  );
  const [visit, setVisit] = useState<Partial<Visit>>(existingVisit || {
    eventId,
    academyId: academy.id,
    salespersonId: event.salespersonId!,
    status: VisitStatus.PENDING,
    vouchersGenerated: [],
    temperature: undefined,
    contactPerson: undefined,
    photos: [],
    leftBanner: false,
    leftFlyers: false,
    summary: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [marketingVerified, setMarketingVerified] = useState(existingVisit ? true : false);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [isEditingVisit, setIsEditingVisit] = useState(false);
  const [editedVisit, setEditedVisit] = useState<Partial<Visit>>({});
  const [showTimeInfo, setShowTimeInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLastVisit = async () => {
      try {
        const last = await DatabaseService.getLastVisit(academy.id);
        setLastVisit(last);
      } catch (error) {
        console.error("Error fetching last visit:", error);
      }
    };
    fetchLastVisit();
  }, [academy.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ((visit.photos?.length || 0) >= 3) {
      alert("Você pode adicionar no máximo 3 fotos.");
      return;
    }

    try {
      setIsUploading(true);
      const photoUrl = await DatabaseService.uploadVisitPhoto(file);
      setVisit(p => ({
        ...p,
        photos: [...(p.photos || []), photoUrl]
      }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erro ao fazer upload da foto.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (existingVisit) {
      setVisit(prev => ({
        ...prev,
        ...existingVisit, // Sincroniza tudo com o banco
        // Mantemos campos locais se estiverem sendo editados? 
        // Na verdade, queremos garantir que o ID venha.
        // Se o usuário digitou notas mas ainda não salvou, e o 'existingVisit' atualizou externamente (ex: polling), perderíamos notas.
        // Mas aqui a atualização externa vem do 'onStart' que nós mesmos chamamos.
        // O onStart salva apenas { startedAt, status: PENDING }.
        // Então é seguro mesclar.
      }));

      // Se já começou, avança tela
      if (existingVisit.status === VisitStatus.PENDING && step === 'START') {
        setStep('ACTIVE');
      }
      // Se já terminou, mostra resumo
      if (existingVisit.status === VisitStatus.VISITED && step !== 'SUMMARY' && step !== 'QR_CODE') {
        setStep('SUMMARY');
      }
    } else {
      // Reset limpo
      setStep('START');
      setVisit({
        eventId,
        academyId: academy.id,
        salespersonId: event.salespersonId!,
        status: VisitStatus.PENDING,
        vouchersGenerated: [],
        summary: '',
        temperature: undefined,
        contactPerson: undefined,
        photos: [],
        leftBanner: false,
        leftFlyers: false
      });
    }
  }, [existingVisit, academy.id, eventId, event.salespersonId]);

  // Validação e finalização da visita (sem vouchers)
  const handleFinishVisit = async () => {
    if (!visit.contactPerson) {
      alert("Por favor, selecione com quem foi a conversa.");
      return;
    }
    if (!visit.temperature) {
      alert("Por favor, selecione a temperatura da academia.");
      return;
    }
    if (!marketingVerified) {
      alert("Por favor, informe se deixou materiais de marketing (Banner/Flyers).");
      return;
    }

    // Salvar visita no banco
    const visitToSave = {
      ...visit,
      status: VisitStatus.VISITED,
      finishedAt: new Date().toISOString() // SEMPRE captura horário atual
    };

    try {
      await onFinish(visitToSave);
    } catch (error) {
      console.error("Error finishing visit:", error);
      alert("Erro ao finalizar visita. Por favor, tente novamente.");
    }
  };

  // Funções de edição
  const handleStartEdit = () => {
    setEditedVisit({
      contactPerson: visit.contactPerson,
      temperature: visit.temperature,
      summary: visit.summary,
      leftBanner: visit.leftBanner,
      leftFlyers: visit.leftFlyers
    });
    setIsEditingVisit(true);
  };

  const handleSaveEditedVisit = async () => {
    if (!editedVisit.contactPerson) {
      toast.error("Por favor, selecione com quem foi a conversa.");
      return;
    }
    if (!editedVisit.temperature) {
      toast.error("Por favor, selecione a temperatura da academia.");
      return;
    }

    try {
      console.log("🔍 Salvando visita - Dados atuais:", visit);
      console.log("🔍 Alterações:", editedVisit);

      // Garantir que todos os campos obrigatórios estejam presentes
      const updatedVisit: Visit = {
        id: visit.id!,
        eventId: visit.eventId!,
        academyId: visit.academyId!,
        salespersonId: visit.salespersonId!,
        status: visit.status!,
        vouchersGenerated: visit.vouchersGenerated || [],
        // Campos editáveis
        contactPerson: editedVisit.contactPerson,
        temperature: editedVisit.temperature,
        summary: editedVisit.summary,
        leftBanner: editedVisit.leftBanner,
        leftFlyers: editedVisit.leftFlyers,
        // Campos opcionais preservados
        startedAt: visit.startedAt,
        finishedAt: visit.finishedAt,
        notes: visit.notes,
        photos: visit.photos,
        updatedAt: new Date().toISOString()
      };

      console.log("🔍 Dados a serem salvos:", updatedVisit);

      const result = await DatabaseService.upsertVisit(updatedVisit);
      console.log("✅ Resultado do salvamento:", result);

      setVisit(updatedVisit);
      setIsEditingVisit(false);
      toast.success("✅ Visita atualizada com sucesso!");
    } catch (error: any) {
      console.error("❌ [App] Error updating visit FULL OBJECT:", error);
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`❌ Erro ao atualizar: ${errorMessage}`);
    }
  };

  const handleCancelEdit = () => {
    setEditedVisit({});
    setIsEditingVisit(false);
  };

  // Detectar se houve mudanças
  const hasChanges = () => {
    return (
      editedVisit.contactPerson !== visit.contactPerson ||
      editedVisit.temperature !== visit.temperature ||
      editedVisit.summary !== visit.summary ||
      editedVisit.leftBanner !== visit.leftBanner ||
      editedVisit.leftFlyers !== visit.leftFlyers
    );
  };

  // Gerar voucher a partir do modal
  const handleGenerateVoucherFromModal = () => {
    setIsEditingVisit(false);
    setStep('VOUCHERS');
  };

  // Finalizar visita a partir do modal
  const handleFinishVisitFromModal = async () => {
    if (!visit.contactPerson && !editedVisit.contactPerson) {
      toast.error("Por favor, selecione com quem foi a conversa antes de finalizar.");
      return;
    }
    if (!visit.temperature && !editedVisit.temperature) {
      toast.error("Por favor, selecione a temperatura antes de finalizar.");
      return;
    }
    if (!marketingVerified) {
      toast.error("Por favor, informe se deixou materiais de marketing.");
      return;
    }

    try {
      // Salvar alterações pendentes + finalizar
      const visitToFinalize = {
        ...visit,
        ...editedVisit,
        status: VisitStatus.VISITED,
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await DatabaseService.upsertVisit(visitToFinalize as Visit);
      setVisit(visitToFinalize);
      setIsEditingVisit(false);
      toast.success("Visita finalizada com sucesso!");

      // Chamar callback de finalização
      await onFinish(visitToFinalize);
    } catch (error) {
      console.error("Error finishing visit:", error);
      toast.error("Erro ao finalizar visita.");
    }
  };

  // Validação e ir para tela de vouchers
  const handleGenerateVoucher = () => {
    if (!visit.contactPerson) {
      alert("Por favor, selecione com quem foi a conversa.");
      return;
    }
    if (!visit.temperature) {
      alert("Por favor, selecione a temperatura da academia.");
      return;
    }
    if (!marketingVerified) {
      alert("Por favor, informe se deixou materiais de marketing (Banner/Flyers).");
      return;
    }

    setStep('VOUCHERS');
  };

  const adjust = (c: number) => { if (c > 0) { const code = generateVoucherCode(); setVisit(p => ({ ...p, vouchersGenerated: [...(p.vouchersGenerated || []), code] })); } else setVisit(p => ({ ...p, vouchersGenerated: (p.vouchersGenerated || []).slice(0, -1) })); };

  // Gera o link para a landing page pública
  // Gera o link para a landing page pública
  const generateShareLink = () => {
    // Prefer public app URL if configured (for QR codes generated in protected environments)
    const origin = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    // We append pathname to handle sub-paths if necessary, but typically with hash routing and custom domains it might just be /
    // If the VITE_PUBLIC_APP_URL is full domain like "https://app.com", likely we just want to append hash.
    // However, keeping pathname logic for safety if they are on "https://app.com/app/"
    const currentPath = window.location.pathname === '/' ? '' : window.location.pathname;

    const baseUrl = cleanOrigin + currentPath;
    const academyName = encodeURIComponent(academy.name);
    const codes = encodeURIComponent(visit.vouchersGenerated?.join(',') || '');
    const timestamp = Date.now();
    return `${baseUrl}/#/public-voucher/${academyName}|${codes}|${timestamp}`;
  };

  const handleFinishWithQr = () => {
    setStep('QR_CODE');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#0f0f0f] overflow-y-auto animate-in slide-in-from-right duration-300 antialiased selection:bg-emerald-500/30">
      {/* Fixed Header */}
      <div className="sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-xl p-5 border-b border-white/5 z-10 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <span className="text-emerald-500 font-bold">🥋</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight tracking-tight">{academy.name}</h3>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">{academy.city} • {academy.state}</p>
          </div>
        </div>
        <button onClick={onCancel} className="bg-neutral-800/50 hover:bg-neutral-800 text-white p-2.5 rounded-2xl transition-all active:scale-90 border border-white/5">
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="p-5 pb-40 space-y-6 max-w-lg mx-auto">


        {/* History Card (Context) */}
        {lastVisit && step === 'ACTIVE' && (
          <div className="glass-card p-5 bg-emerald-500/[0.03] border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center space-x-2 mb-3">
              <History size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Última Visita</span>
              <span className="text-[10px] text-neutral-500">• {new Date(lastVisit.finishedAt!).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                {lastVisit.leftBanner && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-emerald-500/20">Banner já entregue 🚩</span>}
                {lastVisit.leftFlyers && <span className="bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-lg text-[9px] font-bold border border-sky-500/20">Flyers já entregue 📄</span>}
              </div>
              {lastVisit.summary && (
                <p className="text-xs text-neutral-400 italic line-clamp-2 leading-relaxed">"{lastVisit.summary}"</p>
              )}
            </div>
          </div>
        )}

        {/* Content Container - removed heavy borders for mobile full screen feel */}
        <div className="relative">

          {step === 'START' && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                <div className="relative w-24 h-24 bg-neutral-900/50 text-emerald-500 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                  <Clock size={40} strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-white tracking-tight">Iniciar Atendimento</h4>
                <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">Prepare-se para o registro oficial. O tempo de visita será contabilizado a partir do início.</p>
              </div>
              <button
                onClick={() => {
                  const startDetails = {
                    ...visit,
                    startedAt: new Date().toISOString(),
                    status: VisitStatus.PENDING
                  };
                  setVisit(startDetails);
                  setStep('ACTIVE');
                  onStart(startDetails);
                }}
                className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-bold shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 hover:-translate-y-1 transition-all active:scale-95 text-lg"
              >
                Começar Agora 🥋
              </button>
            </div>
          )}

          {step === 'ACTIVE' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Card Conversa */}
              <div className="glass-card p-6 space-y-4">
                <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  Conversa com <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[ContactPerson.OWNER, ContactPerson.TEACHER, ContactPerson.STAFF, ContactPerson.NOBODY].map(person => (
                    <button
                      key={person}
                      onClick={() => setVisit(p => ({ ...p, contactPerson: person }))}
                      className={`py-4 rounded-2xl font-bold transition-all border text-sm ${visit.contactPerson === person ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'}`}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Temperatura */}
              <div className="glass-card p-6 space-y-4">
                <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  Temperatura <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: AcademyTemperature.COLD, label: 'Fria ❄️', color: 'blue' },
                    { value: AcademyTemperature.WARM, label: 'Morna 🌤️', color: 'orange' },
                    { value: AcademyTemperature.HOT, label: 'Quente 🔥', color: 'red' }
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setVisit(p => ({ ...p, temperature: t.value }))}
                      className={`py-4 rounded-2xl font-bold transition-all border text-[11px] ${visit.temperature === t.value
                        ? t.color === 'blue' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                          : t.color === 'orange' ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20'
                            : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                        : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Resumo */}
              <div className="glass-card p-6 space-y-4">
                <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  Resumo da Visita <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(opcional)</span>
                </label>
                <textarea
                  placeholder="Descreva pontos importantes da conversa..."
                  className="w-full h-32 bg-neutral-800/50 text-white p-4 rounded-2xl text-sm outline-none transition-all placeholder:text-neutral-600 border border-white/5 focus:border-emerald-500/30"
                  value={visit.summary}
                  onChange={e => setVisit(p => ({ ...p, summary: e.target.value }))}
                />
              </div>

              {/* Fotos da visita */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-neutral-400 flex justify-between">
                  <span>Fotos da Visita <span className="text-neutral-500 text-xs font-normal">(opcional - até 3)</span></span>
                  <span className="text-[10px] text-neutral-500">{visit.photos?.length || 0}/3</span>
                </label>
                <div className="flex gap-3">
                  {visit.photos?.map((photo, index) => (
                    <div key={index} className="relative w-20 h-20 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 shadow-inner group">
                      <img src={photo} alt={`Visit ${index}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setVisit(p => ({ ...p, photos: p.photos?.filter((_, i) => i !== index) }))}
                        className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {(visit.photos?.length || 0) < 3 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-20 h-20 bg-neutral-800 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:border-emerald-500 hover:text-emerald-500 transition-all active:scale-95"
                    >
                      {isUploading ? <RefreshCw className="animate-spin" size={20} /> : <Camera size={24} strokeWidth={1.5} />}
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Card Marketing */}
              <div className="glass-card p-6 space-y-4">
                <label className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  Materiais <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setVisit(p => ({ ...p, leftBanner: !p.leftBanner }));
                      setMarketingVerified(true);
                    }}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-all border text-sm flex flex-col items-center justify-center space-y-1 ${visit.leftBanner ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'}`}
                  >
                    <span className="text-lg">🚩</span>
                    <span className="text-[10px] uppercase tracking-tighter">Banner</span>
                  </button>
                  <button
                    onClick={() => {
                      setVisit(p => ({ ...p, leftFlyers: !p.leftFlyers }));
                      setMarketingVerified(true);
                    }}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-all border text-sm flex flex-col items-center justify-center space-y-1 ${visit.leftFlyers ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20' : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'}`}
                  >
                    <span className="text-lg">📄</span>
                    <span className="text-[10px] uppercase tracking-tighter">Flyers</span>
                  </button>
                  <button
                    onClick={() => {
                      const none = !(!visit.leftBanner && !visit.leftFlyers && marketingVerified);
                      if (none) {
                        setVisit(p => ({ ...p, leftBanner: false, leftFlyers: false }));
                        setMarketingVerified(true);
                      } else {
                        setMarketingVerified(false);
                      }
                    }}
                    className={`w-full py-3 rounded-2xl font-bold transition-all border text-[10px] uppercase tracking-widest ${!visit.leftBanner && !visit.leftFlyers && marketingVerified ? 'bg-neutral-700 text-white border-neutral-600' : 'bg-neutral-900/50 text-neutral-600 border-white/5 hover:bg-neutral-800'}`}
                  >
                    Nenhum material deixado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Footer for Actions (One-Handed Use) */}
          {step === 'ACTIVE' && (
            <div className="fixed bottom-0 left-0 right-0 p-5 bottom-bar z-20 animate-in slide-in-from-bottom border-t border-white/5">
              <div className="flex gap-3 max-w-lg mx-auto">
                <button
                  onClick={handleFinishVisit}
                  className="flex-1 bg-neutral-800 text-neutral-400 py-4 rounded-3xl font-bold hover:bg-neutral-700 transition-all border border-white/5 active:scale-95 text-xs uppercase tracking-widest"
                >
                  Finalizar Visita
                </button>
                <button
                  onClick={handleGenerateVoucher}
                  className="flex-[1.5] bg-emerald-600 text-white py-4 rounded-3xl font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center space-x-2"
                >
                  <Ticket size={16} />
                  <span>Gerar Voucher</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {step === 'VOUCHERS' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 text-center py-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full"></div>
              <div className="glass-card p-8 flex items-center justify-center space-x-10 animate-in zoom-in-95">
                <button onClick={() => adjust(-1)} className="bg-neutral-800/80 p-4 rounded-2xl border border-white/5 shadow-inner active:scale-90 text-white hover:bg-neutral-700 transition-all">
                  <Minus size={20} />
                </button>
                <div className="flex flex-col">
                  <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{visit.vouchersGenerated?.length || 0}</span>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Vouchers</span>
                </div>
                <button onClick={() => adjust(1)} className="bg-neutral-800/80 p-4 rounded-2xl border border-white/5 shadow-inner active:scale-90 text-white hover:bg-neutral-700 transition-all">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
              {visit.vouchersGenerated?.map((c, i) => (
                <span key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono text-xs font-bold animate-in fade-in duration-300">
                  {c}
                </span>
              ))}
            </div>

            <button
              onClick={handleFinishWithQr}
              className="w-full bg-white text-neutral-900 py-5 rounded-[2rem] font-bold shadow-2xl hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center space-x-3 text-lg"
            >
              <QrCode size={22} />
              <span>Confirmar Vouchers</span>
            </button>
          </div>
        )}

        {step === 'QR_CODE' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center py-6">
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white tracking-tight">QR Code Gerado</h4>
              <p className="text-neutral-500 text-xs">Apresente ao professor para resgate dos benefícios.</p>
            </div>

            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full"></div>
              <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-emerald-500/30 transform hover:scale-105 transition-transform duration-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generateShareLink())}`}
                  alt="Voucher QR Code"
                  className="w-48 h-48 mx-auto mix-blend-multiply"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const landingText = `Thank you for being part of the upcoming PBJJF event! 🥋\n\nYour academy (${academy.name}) has received the following vouchers:\n👉 ${visit.vouchersGenerated?.join(', ')}\n\nTo redeem, please send a text message to (407) 633-9166 with the academy name and the voucher codes listed above.`;
                  navigator.clipboard.writeText(landingText);
                  toast.success("Texto copiado! 📋");
                }}
                className="bg-neutral-800/50 border border-white/5 text-neutral-300 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                <Copy size={16} />
                <span>Copiar</span>
              </button>
              <button
                onClick={() => window.open(generateShareLink(), '_blank')}
                className="bg-neutral-800/50 border border-white/5 text-neutral-300 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                <ExternalLink size={16} />
                <span>Ver Link</span>
              </button>
            </div>

            <button
              onClick={() => onFinish(visit)}
              className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-bold shadow-2xl hover:bg-emerald-500 transition-all active:scale-95 text-lg"
            >
              Concluir Atendimento
            </button>
          </div>
        )}

        {step === 'SUMMARY' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-xl font-bold text-white tracking-tight">Atendimento Concluído</h4>
            </div>

            <div className="space-y-8 pl-6 border-l border-white/5 relative mx-2">
              {/* Timeline Item 1: Base */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-[#0f0f0f]"></div>
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Informações Base</span>
                  <div className="glass-card p-5 grid grid-cols-2 gap-4 border border-white/5">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-600 block">Conversa com</span>
                      <span className="text-sm font-bold text-white">{visit.contactPerson}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-neutral-600 block">Temperatura</span>
                      <span className={`text-[10px] font-bold ${visit.temperature === AcademyTemperature.HOT ? 'text-red-400' : visit.temperature === AcademyTemperature.WARM ? 'text-orange-400' : 'text-blue-400'}`}>
                        {visit.temperature === AcademyTemperature.HOT ? 'Quente 🔥' : visit.temperature === AcademyTemperature.WARM ? 'Morna 🌤️' : 'Fria ❄️'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Item 2: Resumo da Visita */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-[#0f0f0f]"></div>
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Resumo da Visita</span>
                  <div className="glass-card p-5 border border-white/5">
                    <p className="text-sm text-neutral-300 leading-relaxed italic">
                      {visit.summary || 'Nenhum resumo registrado.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Item 3: Marketing */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-[#0f0f0f]"></div>
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Marketing</span>
                  <div className="glass-card p-5 border border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {visit.leftBanner && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg text-[9px] font-bold border border-emerald-500/20">Banner 🚩</span>}
                      {visit.leftFlyers && <span className="bg-sky-500/10 text-sky-400 px-2 py-1 rounded-lg text-[9px] font-bold border border-sky-500/20">Flyers 📄</span>}
                      {!visit.leftBanner && !visit.leftFlyers && <span className="text-neutral-600 text-[10px] italic">Nenhum material deixado</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Item 4: Relacionamento */}
              <div className="relative">
                <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-[#0f0f0f]"></div>
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Relacionamento</span>
                  <div className="glass-card p-5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Ticket size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-white">{visit.vouchersGenerated?.length || 0} Vouchers</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Item 5: Fotos */}
              {visit.photos && visit.photos.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-[#0f0f0f]"></div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fotos</span>
                    <div className="flex gap-2">
                      {visit.photos.map((p, i) => (
                        <div key={i} className="w-16 h-16 rounded-xl overflow-hidden glass-card p-0.5 border-white/10 shadow-lg">
                          <img src={p} alt="" className="w-full h-full object-cover rounded-[10px]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <button
                onClick={handleStartEdit}
                className="flex-1 bg-sky-600 text-white py-5 rounded-[2rem] font-bold hover:bg-sky-500 transition-all active:scale-95 text-lg shadow-xl shadow-sky-500/20"
              >
                Editar
              </button>

              {(!visit.finishedAt || visit.status !== VisitStatus.VISITED) && (
                <button
                  onClick={handleFinishVisit}
                  className="flex-1 bg-emerald-600 text-white py-5 rounded-[2rem] font-bold hover:bg-emerald-500 transition-all active:scale-95 text-lg shadow-xl shadow-emerald-500/20"
                >
                  Finalizar Visita
                </button>
              )}
            </div>

            <button
              onClick={() => onCancel()}
              className="w-full bg-neutral-800 text-neutral-400 py-5 rounded-[2rem] font-bold hover:bg-neutral-700 transition-all border border-white/5 active:scale-95 text-lg mt-3"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Modal de Edição */}
        {isEditingVisit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Editar Visita</h3>
                  <button
                    onClick={() => setShowTimeInfo(true)}
                    className="p-1.5 text-neutral-500 hover:text-sky-400 transition-colors bg-neutral-800/50 rounded-full"
                    title="Informações sobre horários"
                  >
                    <Info size={18} />
                  </button>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="bg-neutral-800 p-2.5 rounded-2xl text-neutral-500 hover:text-white transition-colors border border-white/5 active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Conversa com */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    Conversa com <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[ContactPerson.OWNER, ContactPerson.TEACHER, ContactPerson.STAFF, ContactPerson.NOBODY].map(person => (
                      <button
                        key={person}
                        onClick={() => setEditedVisit(p => ({ ...p, contactPerson: person }))}
                        className={`py-4 rounded-2xl font-bold transition-all border text-sm ${editedVisit.contactPerson === person
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                          : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                          }`}
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperatura */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    Temperatura <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: AcademyTemperature.COLD, label: 'Fria ❄️', color: 'blue' },
                      { value: AcademyTemperature.WARM, label: 'Morna 🌤️', color: 'orange' },
                      { value: AcademyTemperature.HOT, label: 'Quente 🔥', color: 'red' }
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => setEditedVisit(p => ({ ...p, temperature: t.value }))}
                        className={`py-4 rounded-2xl font-bold transition-all border text-[11px] ${editedVisit.temperature === t.value
                          ? t.color === 'blue' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                            : t.color === 'orange' ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-600/20'
                              : 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                          : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                          }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumo da Visita */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    Resumo da Visita <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(opcional)</span>
                  </label>
                  <textarea
                    placeholder="Resumo geral da visita..."
                    className="w-full h-24 bg-neutral-800/50 text-white p-4 rounded-2xl text-sm outline-none transition-all placeholder:text-neutral-600 border border-white/5 focus:border-emerald-500/30"
                    value={editedVisit.summary || ''}
                    onChange={e => setEditedVisit(p => ({ ...p, summary: e.target.value }))}
                  />
                </div>

                {/* Marketing */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    Materiais
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditedVisit(p => ({ ...p, leftBanner: !p.leftBanner }))}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all border text-sm flex flex-col items-center justify-center space-y-1 ${editedVisit.leftBanner
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                        : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                        }`}
                    >
                      <span className="text-lg">🚩</span>
                      <span>Banner</span>
                    </button>
                    <button
                      onClick={() => setEditedVisit(p => ({ ...p, leftFlyers: !p.leftFlyers }))}
                      className={`flex-1 py-4 rounded-2xl font-bold transition-all border text-sm flex flex-col items-center justify-center space-y-1 ${editedVisit.leftFlyers
                        ? 'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-600/20'
                        : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                        }`}
                    >
                      <span className="text-lg">📄</span>
                      <span>Flyers</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões do modal - Reorganizados para maior fluidez */}
              <div className="mt-10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleSaveEditedVisit}
                    disabled={!hasChanges()}
                    className={`h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${hasChanges()
                      ? 'bg-sky-600 text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20 active:scale-95'
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                      }`}
                  >
                    <Save size={18} />
                    Salvar Alterações
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="h-14 bg-neutral-800 text-white rounded-2xl font-medium hover:bg-neutral-700 transition-all border border-white/5 active:scale-95"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <button
                    onClick={handleGenerateVoucherFromModal}
                    className="flex-1 h-12 bg-purple-600/10 text-purple-400 rounded-2xl font-bold hover:bg-purple-600/20 transition-all border border-purple-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                  >
                    Gerar Voucher
                  </button>

                  {(!visit.finishedAt || visit.status !== VisitStatus.VISITED) && (
                    <button
                      onClick={handleFinishVisitFromModal}
                      className="flex-1 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl font-bold hover:bg-emerald-600/20 transition-all border border-emerald-500/20 text-xs uppercase tracking-widest"
                    >
                      Finalizar Visita
                    </button>
                  )}
                </div>
              </div>

              {/* Modal de Informação de Horário */}
              {showTimeInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowTimeInfo(false)}>
                  <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 max-w-xs w-full shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                        <Info size={24} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-white font-bold">Registro de Horários</h4>
                        <p className="text-neutral-400 text-sm leading-relaxed">
                          Por questões de integridade do sistema, os horários de <strong>início</strong> e <strong>fim</strong> da visita são registrados automaticamente e não podem ser alterados manualmente.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowTimeInfo(false)}
                        className="w-full bg-neutral-800 text-white py-3 rounded-xl font-bold hover:bg-neutral-700 transition-colors border border-white/5"
                      >
                        Entendi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};









const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Elevation state
  const [showElevationPrompt, setShowElevationPrompt] = useState(false);
  const { isElevated, session, requestElevation, revokeElevation } = useElevation();

  const [academies, setAcademies] = useState<Academy[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [finance, setFinance] = useState<FinanceRecord[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);

  const [selectedAcademyId, setSelectedAcademyId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [globalToast, setGlobalToast] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => setGlobalToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Limpar campos de seleção ao mudar para abas principais (não detalhes)
  useEffect(() => {
    const detailTabs = ['visit_detail', 'event_detail_admin'];

    // Só limpamos se não estivermos indo para uma tela de detalhes
    if (!detailTabs.includes(activeTab)) {
      setSelectedEventId(null);
      setSelectedAcademyId(null);
    }

    // Verificação de Segurança de Perfil (Role Protection)
    if (currentUser) {
      const adminTabs = ['dashboard', 'access_control', 'academies', 'events', 'admin_finance', 'reports', 'event_detail_admin'];
      if (currentUser.role !== UserRole.ADMIN && adminTabs.includes(activeTab)) {
        setActiveTab('my_events');
      }
      if (currentUser.role === UserRole.ADMIN && activeTab === 'visit_detail') {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, currentUser?.role]);

  useEffect(() => {
    // Check local session
    const storedUser = localStorage.getItem('bjj_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('bjj_user');
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('bjj_user', JSON.stringify(user));
    // Reset state and set initial tab
    setSelectedEventId(null);
    setSelectedAcademyId(null);
    setActiveTab(user.role === UserRole.ADMIN ? 'dashboard' : 'my_events');
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id]); // Use ID to be safe

  const loadData = React.useCallback(async () => {
    try {
      const dbAcademies = await DatabaseService.getAcademies();
      setAcademies(dbAcademies);

      const dbEvents = await DatabaseService.getEvents();
      // Need to fetch academies for each event (junction)
      const eventsWithAcademies = await Promise.all(dbEvents.map(async (e: any) => {
        const ids = await DatabaseService.getEventAcademies(e.id);
        return { ...e, academiesIds: ids };
      }));
      setEvents(eventsWithAcademies);

      const dbVisits = await DatabaseService.getVisits();
      setVisits(dbVisits);

      const dbFinance = await DatabaseService.getFinance();
      setFinance(dbFinance);

      const dbVouchers = await DatabaseService.getVouchers();
      setVouchers(dbVouchers);

      if (currentUser) {
        const dbNotifications = await DatabaseService.getNotifications(currentUser.id);
        setNotifications(dbNotifications);
      }

    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [currentUser?.id]);

  // Real-time Notifications Subscription
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔔 [Notifications] Setting up realtime subscription for user:', currentUser.id);

    const channel = supabase
      .channel(`user-notifs-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('🔔 [Notifications] Received realtime notification:', payload);
          const newN = payload.new;
          const mapped: Notification = {
            id: newN.id,
            userId: newN.user_id,
            message: newN.message,
            read: newN.read,
            timestamp: newN.created_at
          };
          console.log('🔔 [Notifications] Adding to state:', mapped);
          setNotifications(prev => [mapped, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('🔔 [Notifications] Subscription status:', status);
      });

    return () => {
      console.log('🔔 [Notifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // 🔄 Real-time Global Data Sync
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔄 [DataSync] Setting up global realtime synchronization...');

    const channel = supabase
      .channel('global-data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academies' }, (p) => {
        console.log('🔄 [DataSync] academies changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (p) => {
        console.log('🔄 [DataSync] events changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_academies' }, (p) => {
        console.log('🔄 [DataSync] event_academies changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, (p) => {
        console.log('🔄 [DataSync] visits changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, (p) => {
        console.log('🔄 [DataSync] vouchers changed:', p.eventType);
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_records' }, (p) => {
        console.log('🔄 [DataSync] finance_records changed:', p.eventType);
        loadData();
      })
      .subscribe((status) => {
        console.log('🔄 [DataSync] Subscription status:', status);
      });

    return () => {
      console.log('🔄 [DataSync] Cleaning up global synchronization');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, loadData]);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await DatabaseService.getProfile(userId);

      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as UserRole
        });
        // Respect existing local state for tab if not forced
        if (data.role === UserRole.ADMIN && activeTab === 'my_events') {
          setActiveTab('dashboard');
        } else if (data.role !== UserRole.ADMIN && ['dashboard', 'academies', 'events'].includes(activeTab)) {
          setActiveTab('my_events');
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const logout = async () => {
    localStorage.removeItem('bjj_user');
    setCurrentUser(null);
    window.location.reload();
  };

  // Handler de elevação
  const handleElevationRequest = async (password: string, reason: string) => {
    const result = await requestElevation(password, reason);
    if (result.success) {
      setShowElevationPrompt(false);
      setGlobalToast({ message: 'Privilégios elevados com sucesso!', type: 'success' });
    }
    return result;
  };

  const handleElevationRevoke = async () => {
    await revokeElevation();
    setGlobalToast({ message: 'Modo administrativo desativado', type: 'info' });
  };

  const fetchUsers = async () => {
    try {
      const salesData = await DatabaseService.getSalespersons();
      setSellers(salesData as User[]);

      const adminData = await DatabaseService.getAdmins();
      setAdmins(adminData as User[]);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);


  /* Restore notifyUser */
  const notifyUser = async (userId: string, message: string) => {
    console.log('📤 [Notifications] Sending notification:', { userId, message, currentUserId: currentUser?.id });

    // Verificar se notificações estão habilitadas
    try {
      const notificationsEnabled = await DatabaseService.getSetting('admin_notifications_enabled');
      // Se a configuração não existe (null), assume que está habilitado (comportamento padrão)
      // Se existe, verifica se é true (pode ser boolean ou string)
      const isEnabled = notificationsEnabled === null ||
        notificationsEnabled === true ||
        notificationsEnabled === 'true' ||
        notificationsEnabled === '"true"';

      if (!isEnabled) {
        console.log('📴 [Notifications] Notificações desabilitadas - ignorando:', message);
        return; // Não envia notificação
      }
    } catch (error) {
      console.error('📤 [Notifications] Error checking notifications setting:', error);
      // Em caso de erro, continua e envia a notificação (fail-safe)
    }

    // Se a notificação for para o usuário atual, mostramos um toast e adicionamos ao estado
    if (userId === currentUser?.id) {
      setGlobalToast({ message, type: 'info' });
      const newNotif: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        message,
        read: false,
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    // Persist to database
    try {
      await DatabaseService.createNotification(userId, message);
    } catch (error) {
      console.error('📤 [Notifications] Error saving notification:', error);
    }
  };

  const handleUpdateEvent = async (updatedEvent: Event) => {
    try {
      const oldEvent = events.find(e => e.id === updatedEvent.id);

      // 1. Update the main event record
      await DatabaseService.updateEvent(updatedEvent.id, updatedEvent);

      // 2. Sync academies (Junction Table)
      if (oldEvent) {
        const added = updatedEvent.academiesIds.filter(id => !oldEvent.academiesIds.includes(id));
        const removed = oldEvent.academiesIds.filter(id => !updatedEvent.academiesIds.includes(id));

        // Execute junction updates
        for (const id of added) await DatabaseService.addEventAcademy(updatedEvent.id, id);
        for (const id of removed) {
          await DatabaseService.removeEventAcademy(updatedEvent.id, id);
          // Limpar histórico de visita para este evento específico ao remover a academia do evento
          await DatabaseService.deleteVisitByEventAndAcademy(updatedEvent.id, id);
        }
      }

      // 3. Update local state
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));

      // 4. Notifications (Legacy Logic adapted)
      if (oldEvent && oldEvent.salespersonId !== updatedEvent.salespersonId) {
        if (updatedEvent.salespersonId) {
          notifyUser(updatedEvent.salespersonId, `Você é o novo responsável pelo evento "${updatedEvent.name}".`);
        }
        if (oldEvent.salespersonId) {
          notifyUser(oldEvent.salespersonId, `Você não é mais o responsável pelo evento "${oldEvent.name}".`);
        }
      }

      if (oldEvent && updatedEvent.salespersonId) {
        const added = updatedEvent.academiesIds.filter(id => !oldEvent.academiesIds.includes(id));
        if (added.length > 0) {
          notifyUser(updatedEvent.salespersonId, `${added.length} novas academias atribuídas ao evento "${updatedEvent.name}".`);
        }

        // Notificar se detalhes básicos mudaram
        if (oldEvent.name !== updatedEvent.name || oldEvent.city !== updatedEvent.city || oldEvent.state !== updatedEvent.state) {
          notifyUser(updatedEvent.salespersonId, `As informações do evento "${updatedEvent.name}" foram atualizadas.`);
        }
      }

      setGlobalToast({ message: "Evento atualizado com sucesso!", type: 'success' });

    } catch (error) {
      console.error("Error updating event:", error);
      alert("Erro ao atualizar evento.");
    }
  };

  // Se o hash contiver public-voucher, renderiza a tela pública
  if (hash.startsWith('#/public-voucher/')) {
    const rawHash = hash.replace('#/public-voucher/', '');
    // Tenta dividir por pipe literal, ou pipe encoded (%7C) se o browser/scanner codificou
    let voucherData = rawHash.split('|');
    if (voucherData.length < 3 && rawHash.includes('%7C')) {
      voucherData = rawHash.split('%7C');
    }
    const academyName = decodeURIComponent(voucherData[0] || '');
    const codesStr = decodeURIComponent(voucherData[1] || '');
    const timestamp = parseInt(voucherData[2] || '0');

    return (
      <PublicVoucherLanding
        academyName={academyName}
        codes={codesStr.split(',')}
        createdAt={timestamp}
      />
    );
  }


  // Se não estiver logado, exibe a tela de Auth
  if (!currentUser) {
    return <CustomAuth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-neutral-900 font-sans text-neutral-100 overflow-hidden">
      {/* Elevation Prompt Modal */}
      {showElevationPrompt && currentUser && (
        <ElevationPrompt
          userName={currentUser.name}
          onElevate={handleElevationRequest}
          onCancel={() => setShowElevationPrompt(false)}
        />
      )}

      {/* Admin Mode Indicator */}
      {isElevated && session?.expiresAt && currentUser && (
        <AdminModeIndicator
          expiresAt={session.expiresAt}
          onRevoke={handleElevationRevoke}
          userName={currentUser.name}
        />
      )}

      {/* Sidebar - Only for Admin */}
      {
        currentUser.role === UserRole.ADMIN && (
          <Sidebar
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            logout={logout}
          />
        )
      }

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${currentUser.role === UserRole.SALES ? 'pb-16' : ''} ${isElevated ? 'pt-24' : ''}`}> {/* Add padding top for admin indicator */}

        {/* Navbar - Only for Admin (Salesperson uses simplified header or just content) */}
        {currentUser.role === UserRole.ADMIN ? (
          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeTab={activeTab}
            onOpenElevationPrompt={() => setShowElevationPrompt(true)}
          />
        ) : (
          /* Salesperson Header */
          <header className="bg-neutral-900 border-b border-neutral-800 p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/oss_logo.jpg" alt="Logo" className="w-8 h-8 object-contain mix-blend-screen filter invert hue-rotate-180 brightness-110 contrast-125 saturate-150" />
              <h1 className="text-lg font-bold text-white tracking-tight">BJJVisits</h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{currentUser.name}</p>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 print:p-0 relative">
          {/* Real-time Toast System (Success/Info/Error for the actor) */}
          {globalToast && (
            <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-[200] animate-in slide-in-from-top-4 duration-500">
              <div className={cn(
                "p-4 rounded-[1.5rem] shadow-2xl border backdrop-blur-xl flex items-center space-x-3",
                globalToast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                  globalToast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-400" :
                    "bg-[hsl(262,83%,58%)]/20 border-[hsl(262,83%,58%)]/30 text-white"
              )}>
                <div className={cn(
                  "p-2 rounded-xl",
                  globalToast.type === 'success' ? "bg-emerald-500/20" :
                    globalToast.type === 'error' ? "bg-red-500/20" :
                      "bg-white/10"
                )}>
                  {globalToast.type === 'success' ? <CheckCircle2 size={18} /> :
                    globalToast.type === 'error' ? <AlertCircle size={18} /> :
                      <Bell size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black leading-tight">{globalToast.message}</p>
                </div>
                <button onClick={() => setGlobalToast(null)} className="text-white/40 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Incoming Notifications Alert Feed (Messages from other users) */}
          {notifications.filter(n => n.userId === currentUser.id && !n.read).length > 0 && (
            <div className="mb-8 space-y-3 max-w-2xl">
              <div className="flex items-center space-x-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 ml-2">
                <TrendingUp size={12} />
                <span>Alertas do Sistema</span>
              </div>
              {notifications.filter(n => n.userId === currentUser.id && !n.read).map((n) => (
                <div key={n.id} className="group relative overflow-hidden bg-gradient-to-r from-neutral-800 to-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 flex justify-between items-center shadow-xl animate-in slide-in-from-left-4 duration-500 hover:border-white/20 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex items-center space-x-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 group-hover:scale-110 transition-transform">
                      <Bell size={18} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/90 leading-tight">{n.message}</p>
                      <p className="text-[10px] text-white/30 font-medium mt-1 uppercase tracking-wider">há poucos segundos</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                      DatabaseService.markNotificationAsRead(n.id).catch(err => console.error("Error marking read:", err));
                    }}
                    className="relative z-10 p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dashboard' && currentUser.role === UserRole.ADMIN && <AdminDashboard events={events} academies={academies} visits={visits} vouchers={vouchers} finance={finance} vendedores={sellers} />}
          {activeTab === 'access_control' && currentUser.role === UserRole.ADMIN && (
            <UsersManager
              users={[...sellers, ...admins]}
              setUsers={(newUsersOrUpdater: any) => {
                if (typeof newUsersOrUpdater === 'function') {
                  fetchUsers();
                } else {
                  setSellers(newUsersOrUpdater.filter((u: User) => u.role === UserRole.SALES));
                  setAdmins(newUsersOrUpdater.filter((u: User) => u.role === UserRole.ADMIN));
                }
              }}
              currentUser={currentUser}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'academies' && currentUser.role === UserRole.ADMIN && <AcademiesManager academies={academies} setAcademies={setAcademies} currentUser={currentUser} notifyUser={notifyUser} events={events} />}
          {activeTab === 'events' && currentUser.role === UserRole.ADMIN && <EventsManager events={events} visits={visits} setEvents={setEvents} academies={academies} vendedores={sellers} onSelectEvent={(id) => { setSelectedEventId(id); setActiveTab('event_detail_admin'); }} notifyUser={notifyUser} />}
          {activeTab === 'event_detail_admin' && selectedEventId && currentUser.role === UserRole.ADMIN && (
            <EventDetailAdmin
              event={events.find(e => e.id === selectedEventId)!}
              academies={academies}
              visits={visits}
              vendedores={sellers}
              onBack={() => setActiveTab('events')}
              onUpdateEvent={handleUpdateEvent}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'admin_finance' && currentUser.role === UserRole.ADMIN && (
            <AdminFinance
              finance={finance}
              setFinance={setFinance}
              events={events}
              vendedores={sellers}
              notifyUser={notifyUser}
            />
          )}
          {activeTab === 'reports' && currentUser.role === UserRole.ADMIN && <Reports visits={visits} academies={academies} events={events} vouchers={vouchers} vendedores={sellers} />}

          {activeTab === 'my_events' && <SalespersonEvents events={events.filter(e => e.salespersonId === currentUser.id)} academies={academies} visits={visits} notifications={notifications.filter(n => n.userId === currentUser.id && !n.read)} onDismissNotif={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onSelectAcademy={(eventId, academyId) => { setSelectedEventId(eventId); setSelectedAcademyId(academyId); setActiveTab('visit_detail'); }} currentUserId={currentUser.id} />}
          {activeTab === 'visit_detail' && selectedEventId && selectedAcademyId && (
            <VisitDetail
              eventId={selectedEventId}
              academy={academies.find(a => a.id === selectedAcademyId)!}
              event={events.find(e => e.id === selectedEventId)!}
              existingVisit={visits.find(v => v.eventId === selectedEventId && v.academyId === selectedAcademyId)}
              onStart={async (visit: Visit) => {
                try {
                  const saved = await DatabaseService.upsertVisit(visit);
                  // Update local state to reflect the started visit
                  setVisits(prev => {
                    const filtered = prev.filter(v => !(v.eventId === visit.eventId && v.academyId === visit.academyId));
                    return [...filtered, saved];
                  });
                } catch (e) {
                  console.error("Error starting visit:", e);
                }
              }}
              onFinish={async (visit) => {
                try {
                  // Save Visit
                  const savedVisit = await DatabaseService.upsertVisit(visit);
                  setVisits(prev => [...prev.filter(v => !(v.eventId === visit.eventId && v.academyId === visit.academyId)), savedVisit]);

                  // Save Vouchers
                  const currentVoucherCodes = new Set(vouchers.map(v => v.code));
                  const newVoucherObjects: Voucher[] = (visit.vouchersGenerated || [])
                    .filter(code => !currentVoucherCodes.has(code))
                    .map(code => ({
                      code,
                      eventId: visit.eventId,
                      academyId: visit.academyId,
                      visitId: savedVisit.id,
                      createdAt: new Date().toISOString()
                    }));

                  if (newVoucherObjects.length > 0) {
                    await DatabaseService.createVouchers(newVoucherObjects);
                    setVouchers(prev => [...prev, ...newVoucherObjects]);
                  }

                  // Notify Admins (Only if transitioning to VISITED for the first time)
                  const previousVisitState = visits.find(v => v.eventId === visit.eventId && v.academyId === visit.academyId);
                  const isTransitioningToVisited = visit.status === VisitStatus.VISITED && (!previousVisitState || previousVisitState.status !== VisitStatus.VISITED);

                  if (isTransitioningToVisited) {
                    admins.forEach(admin => {
                      notifyUser(admin.id, `O vendedor ${currentUser.name} concluiu uma visita na academia "${academies.find(a => a.id === selectedAcademyId)?.name}".`);
                    });
                  }

                  setActiveTab('my_events');
                } catch (error) {
                  console.error("Error saving visit:", error);
                  alert("Erro ao salvar visita.");
                }
              }}
              onCancel={() => setActiveTab('my_events')}
            />
          )}
          {activeTab === 'sales_finance' && (
            <SalesFinance
              finance={finance.filter(f => f.salespersonId === currentUser.id)}
              events={events}
              onConfirm={async (recordId) => {
                const record = finance.find(f => f.id === recordId);
                if (record) {
                  try {
                    const updated = await DatabaseService.updateFinance(record.id, { ...record, status: FinanceStatus.RECEIVED, updatedAt: new Date().toISOString() });
                    setFinance(prev => prev.map(f => f.id === recordId ? updated : f));

                    // Notificar admins que o vendedor recebeu o dinheiro
                    const eventName = events.find(e => e.id === record.eventId)?.name;
                    admins.forEach(admin => {
                      notifyUser(admin.id, `O vendedor ${currentUser?.name} confirmou o recebimento de $ ${record.amount.toFixed(2)} referente ao evento "${eventName}".`);
                    });
                  } catch (error) {
                    console.error("Error confirming finance:", error);
                  }
                }
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav - Only for Salesperson */}
      {
        currentUser.role === UserRole.SALES && (
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            logout={logout}
          />
        )
      }

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
};

// Wrapper principal com ElevationProvider
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Carregar usuário do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('bjj_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('bjj_user');
      }
    }
  }, []);

  return (
    <ElevationProvider userId={currentUser?.id || null}>
      <AppContent />
    </ElevationProvider>
  );
};

export default App;

