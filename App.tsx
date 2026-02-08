
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
  Upload,
  Mic,
  Send,
  Lock,
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
            <img src="/PBJJF_logo.jpeg" alt="PBJJF" className="h-full w-auto filter invert hue-rotate-180 brightness-150 contrast-125 mix-blend-screen" />
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
  const nonTestEvents = events.filter(e => !e.name.trim().toUpperCase().endsWith('TESTE'));
  const totalAcademies = nonTestEvents.reduce((acc, e) => acc + (e.academiesIds?.length || 0), 0);
  const completedVisitsCount = nonTestEvents.reduce((acc, e) => {
    const visitedInEvent = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
    const uniqueVisitedIds = new Set(visitedInEvent.map(v => v.academyId));
    const validVisitedCount = Array.from(uniqueVisitedIds).filter(aid => e.academiesIds.includes(aid)).length;
    return acc + validVisitedCount;
  }, 0);

  const activeVisit = visits.find(v => v.salespersonId === currentUserId && v.status === VisitStatus.PENDING);
  const isOverdue = activeVisit && activeVisit.startedAt && (Date.now() - new Date(activeVisit.startedAt).getTime() > 3600000);

  const handleAcademyClick = (eventId: string, academyId: string) => {
    if (activeVisit) {
      if (activeVisit.academyId !== academyId || activeVisit.eventId !== eventId) {
        toast.error("Você já tem uma visita em andamento!", {
          description: "Finalize a visita atual antes de iniciar outra."
        });
        return;
      }
    }
    onSelectAcademy(eventId, academyId);
  };

  return (
    <div className="space-y-10 pb-40 animate-in fade-in slide-in-from-bottom-5 duration-700">

      {/* Dynamic Header Badge for Active Tasks - Premium Glassmorphism */}
      {activeVisit && (
        <div
          onClick={() => handleAcademyClick(activeVisit.eventId, activeVisit.academyId)}
          className={cn(
            "relative overflow-hidden p-6 rounded-[2.5rem] border backdrop-blur-3xl cursor-pointer group transition-all duration-500 hover:-translate-y-1 active:scale-[0.98] shadow-2xl",
            isOverdue
              ? "bg-red-500/10 border-red-500/30 shadow-red-500/20"
              : "bg-emerald-500/15 border-emerald-500/30 shadow-emerald-500/20"
          )}
        >
          {/* Animated decorative glow */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r transition-opacity duration-1000",
            isOverdue ? "from-red-500/10 to-transparent" : "from-emerald-500/10 to-transparent"
          )} />

          <div className="flex items-center space-x-5 relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110",
              isOverdue ? "bg-red-500 text-white" : "bg-emerald-500 text-white shadow-emerald-500/40"
            )}>
              {isOverdue ? <AlertCircle size={32} className="animate-pulse" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                  isOverdue ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  {isOverdue ? "Crítico" : "Em Andamento"}
                </span>
                {isOverdue && <span className="text-[10px] font-black text-red-500 animate-pulse">⏰ HÁ +1H</span>}
              </div>
              <h4 className="text-xl font-black text-white tracking-tight mt-1 truncate">
                {academies.find(a => a.id === activeVisit.academyId)?.name}
              </h4>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">
                Toque para continuar o atendimento
              </p>
            </div>
            <ChevronRight size={24} className={cn("transition-transform group-hover:translate-x-2", isOverdue ? "text-red-500/40" : "text-emerald-500/40")} />
          </div>
        </div>
      )}

      {/* Premium Hero Stats Section */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden group">
          {/* Decorative background flare */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-1000"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">Desempenho</h2>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-emerald-500 italic tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {Math.round((completedVisitsCount / (totalAcademies || 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Progresso de Visitas</span>
                <span className="text-[10px] font-black text-emerald-500/60">{completedVisitsCount} / {totalAcademies}</span>
              </div>
              <ProgressBar percentage={Math.round((completedVisitsCount / (totalAcademies || 1)) * 100)} height="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-colors hover:bg-white/10">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Alocado</p>
                <p className="text-2xl font-black text-white mt-1 tracking-tighter italic">{totalAcademies}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-right transition-colors hover:bg-emerald-500/10">
                <p className="text-[9px] font-black text-emerald-500/30 uppercase tracking-widest text-right">Concluídos</p>
                <p className="text-2xl font-black text-emerald-500 mt-1 tracking-tighter italic">{completedVisitsCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-2">
          <div className="h-px flex-1 bg-white/5"></div>
          <div className="flex items-center space-x-2">
            <CalendarDays size={14} className="text-white/20" />
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Cronograma Ativo</h2>
          </div>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>

        {events.length === 0 ? (
          <div className="bg-neutral-900/50 border border-white/5 rounded-[3rem] p-16 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10 border border-white/5">
              <CalendarDays size={40} strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-white italic uppercase tracking-tight">Roteiro Vazio</p>
              <p className="text-xs text-white/30 max-w-[200px] mx-auto leading-relaxed">Aguarde a atribuição de novos eventos pelos administradores.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((e, idx) => {
              const allAcademiesIds = e.academiesIds || [];
              const allAcademies = allAcademiesIds.map(aid => academies.find(a => a.id === aid)).filter(Boolean) as Academy[];

              const visitedInEvent = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
              const uniqueVisitedIds = new Set(visitedInEvent.map(v => v.academyId));
              const validVisitedCount = Array.from(uniqueVisitedIds).filter(aid => allAcademiesIds.includes(aid)).length;

              const completedIds = Array.from(uniqueVisitedIds).filter(aid => allAcademiesIds.includes(aid));
              const pendingAcademies = allAcademies.filter(a => !completedIds.includes(a.id));
              const finishedAcademies = allAcademies.filter(a => completedIds.includes(a.id));
              const progress = Math.round((validVisitedCount / (allAcademiesIds.length || 1)) * 100);

              return (
                <div
                  key={e.id}
                  className="group relative animate-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {/* Event Card Header - Integrated Feel */}
                  <div className="mb-4 flex items-end justify-between px-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{e.name}</h3>
                      </div>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">{e.city} • {e.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2 mb-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Progresso</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{progress}%</span>
                      </div>
                      <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white/20">
                    {/* Event Content */}
                    <div className="p-2 space-y-2">
                      {/* Pendentes */}
                      {pendingAcademies.map(a => {
                        const isActive = activeVisit?.academyId === a.id && activeVisit?.eventId === e.id;
                        return (
                          <div
                            key={a.id}
                            onClick={() => handleAcademyClick(e.id, a.id)}
                            className={cn(
                              "relative group m-1 p-4 flex justify-between items-center rounded-2xl cursor-pointer transition-all duration-500 active:scale-[0.98]",
                              isActive
                                ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20"
                                : "bg-white/5 hover:bg-white/[0.08] text-white/90 border border-white/5"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={cn("font-black text-sm tracking-tight truncate uppercase", isActive ? "text-white" : "text-white/80")}>
                                  {a.name}
                                </p>
                                {isActive && <Loader2 size={12} className="animate-spin opacity-50 ml-2 shrink-0" />}
                              </div>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <p className={cn("text-[9px] font-bold truncate opacity-60 uppercase tracking-widest", isActive ? "text-white" : "text-white/40")}>
                                  {a.responsible}
                                </p>
                                <span className="text-[8px] opacity-20">•</span>
                                <p className={cn("text-[9px] font-bold opacity-60 uppercase tracking-widest", isActive ? "text-white" : "text-white/40")}>
                                  {a.city}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                              isActive ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"
                            )}>
                              <ChevronRight size={18} strokeWidth={3} className={cn("transition-transform group-active:translate-x-1", isActive ? "text-white" : "text-white/20")} />
                            </div>
                          </div>
                        );
                      })}

                      {pendingAcademies.length === 0 && (
                        <div className="py-6 flex items-center justify-center">
                          <div className="px-4 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center space-x-2">
                            <CheckCircle2 size={10} className="text-emerald-500/40" />
                            <span className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.2em]">Roteiro Concluído</span>
                          </div>
                        </div>
                      )}

                      {/* Concluídas (Simplified list with better styling) */}
                      {finishedAcademies.length > 0 && (
                        <div className="m-1 pt-6 pb-2 border-t border-white/5">
                          <div className="flex items-center justify-between px-3 mb-4">
                            <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Visitas Realizadas</h4>
                            <span className="text-[9px] font-black text-emerald-500/40 uppercase bg-emerald-500/5 px-2 py-0.5 rounded-full">
                              {finishedAcademies.length} Academias
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 px-2">
                            {finishedAcademies.map(a => {
                              const visit = visits.find(v => v.eventId === e.id && v.academyId === a.id);
                              return (
                                <div
                                  key={a.id}
                                  onClick={() => handleAcademyClick(e.id, a.id)}
                                  className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full flex items-center space-x-2 active:scale-95 transition-all group/done hover:bg-white/5"
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    visit?.temperature === AcademyTemperature.HOT ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-emerald-500/40'
                                  )}></div>
                                  <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter truncate max-w-[100px] group-hover/done:text-white/60 transition-colors">{a.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
/**
 * WhatsApp-style Voice Transcription Component
 */
const WhatsAppVoiceMic: React.FC<{ onTranscript: (text: string) => void }> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const [slideOffset, setSlideOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        stopRecording(true);
      };
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startRecording = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();

    if (!recognitionRef.current) {
      toast.error("Seu navegador não suporta transcrição de voz.");
      return;
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };

    setIsRecording(true);
    setIsLocked(false);
    setIsCancelled(false);
    setDuration(0);
    setSlideOffset({ x: 0, y: 0 });

    recognitionRef.current.start();

    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 100);
  };

  const stopRecording = (cancel = false) => {
    if (!isRecording) return;

    clearInterval(timerRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setIsLocked(false);
    setSlideOffset({ x: 0, y: 0 });

    if (cancel) {
      setIsCancelled(true);
      setTimeout(() => setIsCancelled(false), 1000);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isRecording || isLocked) return;

    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    setSlideOffset({ x: deltaX < 0 ? deltaX : 0, y: deltaY < 0 ? deltaY : 0 });

    if (deltaX < -100) {
      stopRecording(true);
    } else if (deltaY < -100) {
      setIsLocked(true);
      setSlideOffset({ x: 0, y: 0 });
    }
  };

  const formatTime = (totalDeciSeconds: number) => {
    const totalSeconds = Math.floor(totalDeciSeconds / 10);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {isRecording && (
        <div className="flex-1 flex items-center bg-black/80 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center space-x-3 w-full">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-xs">{formatTime(duration)}</span>
            </div>

            {!isLocked ? (
              <div className="flex-1 flex justify-center overflow-hidden">
                <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest animate-pulse whitespace-nowrap">
                  {slideOffset.x < -20 ? 'Solte para cancelar' : 'Deslize para cancelar ←'}
                </span>
              </div>
            ) : (
              <div className="flex-1 flex justify-center">
                <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest animate-pulse">Gravando Transcrição...</span>
              </div>
            )}

            {isLocked && (
              <button
                onClick={() => stopRecording(true)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {isRecording && !isLocked && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 flex flex-col items-center animate-bounce">
            <div className="bg-neutral-800 p-2 rounded-full border border-white/10 shadow-lg">
              <Lock size={14} className="text-white/40" />
            </div>
            <div className="w-px h-3 bg-gradient-to-t from-white/10 to-transparent mt-1"></div>
          </div>
        )}

        <button
          onMouseDown={startRecording}
          onMouseUp={() => !isLocked && stopRecording()}
          onMouseMove={handleMove}
          onTouchStart={startRecording}
          onTouchEnd={() => !isLocked && stopRecording()}
          onTouchMove={handleMove}
          onClick={() => isLocked && stopRecording()}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl touch-none select-none",
            isRecording
              ? "bg-red-500 scale-125 z-50 text-white"
              : "bg-emerald-500 hover:bg-emerald-400 text-white"
          )}
          style={{
            transform: isRecording && !isLocked ? `translate(${slideOffset.x}px, ${slideOffset.y}px)` : undefined,
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {isLocked ? <Send size={18} /> : <Mic size={20} />}
        </button>
      </div>
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
  const [isEditingVisit, setIsEditingVisit] = useState(false);
  const [editedVisit, setEditedVisit] = useState<Partial<Visit>>({});
  const [showTimeInfo, setShowTimeInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentPhotos = isEditingVisit ? (editedVisit.photos || []) : (visit.photos || []);

    if (currentPhotos.length >= 3) {
      alert("Você pode adicionar no máximo 3 fotos.");
      return;
    }

    try {
      setIsUploading(true);
      const photoUrl = await DatabaseService.uploadVisitPhoto(file);

      if (isEditingVisit) {
        setEditedVisit(p => ({
          ...p,
          photos: [...(p.photos || []), photoUrl]
        }));
      } else {
        setVisit(p => ({
          ...p,
          photos: [...(p.photos || []), photoUrl]
        }));
      }
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
      leftFlyers: visit.leftFlyers,
      photos: visit.photos || []
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
        photos: editedVisit.photos || visit.photos,
        updatedAt: new Date().toISOString()
      };

      console.log("🔍 Dados a serem salvos:", updatedVisit);

      const result = await DatabaseService.upsertVisit(updatedVisit);
      console.log("✅ Resultado do salvamento:", result);

      setVisit(result);
      setIsEditingVisit(false);

      // Propagar mudanças para o componente pai
      await onFinish(result);

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
      editedVisit.leftFlyers !== visit.leftFlyers ||
      JSON.stringify(editedVisit.photos) !== JSON.stringify(visit.photos)
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

  const generateShareLink = () => {
    const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const codesStr = visit.vouchersGenerated?.join(',') || '';
    const timestamp = Date.now();
    return `${baseUrl}/#/public-voucher/${encodeURIComponent(academy.name)}|${encodeURIComponent(codesStr)}|${timestamp}`;
  };

  const handleFinishWithQr = () => {
    setStep('QR_CODE');
  };

  const steps = [
    { id: 'START', label: 'Início', icon: <Play size={12} /> },
    { id: 'ACTIVE', label: 'Atendimento', icon: <Edit3 size={12} /> },
    { id: 'VOUCHERS', label: 'Vouchers', icon: <Ticket size={12} /> },
    { id: 'QR_CODE', label: 'Resgate', icon: <QrCode size={12} /> },
    { id: 'SUMMARY', label: 'Resumo', icon: <CheckCircle2 size={12} /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0a0a0a] overflow-y-auto animate-in slide-in-from-right duration-300 antialiased selection:bg-emerald-500/30 custom-scrollbar">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Fixed Header */}
      <div className="sticky top-0 bg-black/60 backdrop-blur-2xl p-4 border-b border-white/5 z-50 flex flex-col space-y-3 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-base font-black text-white leading-tight tracking-tight">{academy.name}</h3>
              <p className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.2em]">{academy.city} • {academy.state}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (step === 'ACTIVE' && !confirm('Deseja realmente cancelar a visita? O progresso será perdido.')) return;
              onCancel();
            }}
            className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white p-2.5 rounded-2xl transition-all active:scale-90 border border-white/5"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex flex-col items-center space-y-1 relative flex-1">
              <div className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-500 relative z-10",
                idx <= currentStepIndex ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-white/20 border border-white/5"
              )}>
                {idx < currentStepIndex ? <CheckCircle2 size={10} strokeWidth={3} /> : s.icon}
              </div>
              <span className={cn(
                "text-[7px] font-black uppercase tracking-tighter transition-colors duration-500",
                idx <= currentStepIndex ? "text-emerald-500" : "text-white/10"
              )}>
                {s.label}
              </span>
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute top-2.5 left-[50%] w-full h-[2px] -z-0">
                  <div className={cn(
                    "h-full transition-all duration-500",
                    idx < currentStepIndex ? "bg-emerald-500" : "bg-white/5"
                  )}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-40 space-y-2 max-w-lg mx-auto relative z-10">
        {/* History Card (Context) */}

        {/* Content Container */}
        <div className="relative">

          {step === 'START' && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-10 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse"></div>
                <div className="relative w-32 h-32 bg-neutral-900 border-2 border-emerald-500/30 text-emerald-500 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10 transition-transform hover:scale-105 duration-500">
                  <Play size={48} strokeWidth={1} fill="currentColor" className="ml-1 opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock size={40} strokeWidth={1.5} className="animate-[spin_10s_linear_infinite]" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-3xl font-black text-white tracking-tighter">Pronto para a visita?</h4>
                <p className="text-white/40 text-sm max-w-xs mx-auto leading-relaxed font-medium">O cronômetro iniciará assim que você tocar no botão abaixo. Garanta um registro fiel do seu esforço.</p>
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
                className="group relative w-full h-20 bg-emerald-600 rounded-[2.5rem] p-1 flex items-center shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-full h-full rounded-[2.2rem] border-2 border-white/20 flex items-center justify-center space-x-3 relative z-10 transition-transform group-hover:scale-[0.99]">
                  <span className="text-white text-xl font-black uppercase tracking-tight">Iniciar Atendimento</span>
                  <ChevronRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          )}

          {step === 'ACTIVE' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Card Conversa */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Pessoa de Contato <span className="text-red-500">*</span></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: ContactPerson.OWNER, label: 'Proprietário' },
                    { val: ContactPerson.TEACHER, label: 'Professor' },
                    { val: ContactPerson.STAFF, label: 'Secretaria' },
                    { val: ContactPerson.NOBODY, label: 'Ninguém' }
                  ].map(p => (
                    <button
                      key={p.val}
                      onClick={() => setVisit(v => ({ ...v, contactPerson: p.val }))}
                      className={cn(
                        "group relative overflow-hidden py-5 px-4 rounded-[2rem] border transition-all duration-300 flex flex-col items-center justify-center space-y-2 active:scale-95",
                        visit.contactPerson === p.val
                          ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                          : "bg-white/5 border-white/5 text-white/40 hover:border-white/10"
                      )}
                    >
                      <span className={cn("text-[11px] font-black uppercase tracking-wider", visit.contactPerson === p.val ? "text-emerald-400" : "text-white/20")}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Temperatura */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Temperatura da Oportunidade <span className="text-red-500">*</span></label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: AcademyTemperature.COLD, label: 'Fria', icon: '❄️', color: 'blue' },
                    { value: AcademyTemperature.WARM, label: 'Morna', icon: '🌤️', color: 'amber' },
                    { value: AcademyTemperature.HOT, label: 'Quente', icon: '🔥', color: 'red' }
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setVisit(p => ({ ...p, temperature: t.value }))}
                      className={cn(
                        "group py-5 rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-center space-y-2 active:scale-95",
                        visit.temperature === t.value
                          ? t.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30'
                            : t.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-red-500/10 border-red-500/30'
                          : 'bg-white/5 border-white/5 text-white/40'
                      )}
                    >
                      <span className={cn("text-2xl transition-transform duration-500 group-hover:scale-110", visit.temperature === t.value ? "opacity-100" : "opacity-30")}>{t.icon}</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        visit.temperature === t.value
                          ? t.color === 'blue' ? 'text-blue-400' : t.color === 'amber' ? 'text-amber-400' : 'text-red-400'
                          : "text-white/20"
                      )}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Resumo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Resumo Executivo <span className="text-white/20 text-[9px] font-medium lowercase ml-1">(opcional)</span></label>
                  </div>
                  <WhatsAppVoiceMic onTranscript={(text) => setVisit(p => ({ ...p, summary: (p.summary ? p.summary + ' ' : '') + text }))} />
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <textarea
                    placeholder="Quais os pontos principais desta visita? Algo importante para o futuro?"
                    className="relative w-full h-36 bg-white/[0.03] text-white p-6 rounded-[2rem] text-sm outline-none transition-all placeholder:text-white/10 border border-white/5 focus:border-emerald-500/30 focus:bg-white/[0.05]"
                    value={visit.summary}
                    onChange={e => setVisit(p => ({ ...p, summary: e.target.value }))}
                  />
                </div>
              </div>

              {/* Fotos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-4 bg-sky-500 rounded-full"></div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Evidências Fotográficas</label>
                  </div>
                  <span className="text-[10px] font-black text-white/20">{visit.photos?.length || 0}/3</span>
                </div>

                <div className="flex gap-4">
                  {visit.photos?.map((photo, index) => (
                    <div key={index} className="relative w-24 h-24 bg-white/5 rounded-[1.5rem] overflow-hidden border border-white/10 group animate-in zoom-in-95">
                      <img src={photo} alt={`Visit ${index}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <button
                        onClick={() => setVisit(p => ({ ...p, photos: p.photos?.filter((_, i) => i !== index) }))}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {(visit.photos?.length || 0) < 3 && (
                    <div
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                      className="w-24 h-24 bg-white/5 border-2 border-dashed border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center text-white/20 hover:border-sky-500/40 hover:text-sky-400 transition-all cursor-pointer active:scale-95 group"
                    >
                      {isUploading ? <Loader2 className="animate-spin text-sky-500" size={24} /> : (
                        <>
                          <Camera size={28} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black uppercase mt-1">Anexar</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>

              {/* Card Marketing */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 px-1">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Entrega de Marketing <span className="text-red-500">*</span></label>
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'leftBanner', label: 'Banner 🚩', icon: '🚩' },
                    { key: 'leftFlyers', label: 'Flyers 📄', icon: '📄' }
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => {
                        setVisit(p => ({ ...p, [m.key]: !p[m.key as keyof Visit] }));
                        setMarketingVerified(true);
                      }}
                      className={cn(
                        "flex-1 group relative overflow-hidden py-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-center space-y-2 active:scale-95",
                        visit[m.key as keyof Visit]
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-white/5 border-white/5 text-white/40"
                      )}
                    >
                      <span className={cn("text-2xl transition-transform duration-500 group-hover:scale-110", visit[m.key as keyof Visit] ? "opacity-100" : "opacity-30")}>{m.icon}</span>
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", visit[m.key as keyof Visit] ? "text-emerald-400" : "text-white/20")}>{m.label}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setVisit(p => ({ ...p, leftBanner: false, leftFlyers: false }));
                      setMarketingVerified(true);
                    }}
                    className={cn(
                      "w-full py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] border transition-all active:scale-95",
                      !visit.leftBanner && !visit.leftFlyers && marketingVerified
                        ? "bg-white/20 border-white/20 text-white"
                        : "bg-white/5 border-white/5 text-white/20"
                    )}
                  >
                    Nenhum material entregue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions for Step ACTIVE */}
          {step === 'ACTIVE' && (
            <div className="pt-8 pb-12 animate-in fade-in duration-700">
              <div className="max-w-md mx-auto flex gap-4">
                <button
                  onClick={handleFinishVisit}
                  className="flex-1 bg-white/5 backdrop-blur-xl text-white/40 border border-white/10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                >
                  Finalizar
                </button>
                <button
                  onClick={handleGenerateVoucher}
                  className="flex-[2] bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl flex items-center justify-center space-x-3"
                >
                  <Ticket size={20} strokeWidth={3} />
                  <span>Gerar Vouchers</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {step === 'VOUCHERS' && (
          <div className="space-y-12 animate-in slide-in-from-right-10 duration-500 text-center py-10">
            <div className="space-y-2">
              <h4 className="text-3xl font-black text-white tracking-tighter italic uppercase">Gerador de Vouchers</h4>
              <p className="text-white/40 text-xs font-medium max-w-[200px] mx-auto uppercase tracking-widest">Selecione o volume de benefícios para esta academia.</p>
            </div>

            <div className="relative group flex items-center justify-center space-x-12 py-10">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>

              <button
                onClick={() => adjust(-1)}
                className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-2xl"
              >
                <Minus size={24} strokeWidth={3} />
              </button>

              <div className="flex flex-col items-center">
                <div className="text-8xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                  {visit.vouchersGenerated?.length || 0}
                </div>
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">Vouchers Ativos</div>
              </div>

              <button
                onClick={() => adjust(1)}
                className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 hover:bg-emerald-400 transition-all active:scale-90"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto min-h-[40px]">
              {visit.vouchersGenerated?.map((c, i) => (
                <div key={i} className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl font-mono text-[10px] font-black text-emerald-400 animate-in zoom-in-95" style={{ animationDelay: `${i * 50}ms` }}>
                  {c}
                </div>
              ))}
            </div>

            <button
              onClick={handleFinishWithQr}
              disabled={!visit.vouchersGenerated?.length}
              className={cn(
                "w-full h-20 rounded-[2.5rem] font-black text-lg uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center space-x-4 shadow-2xl",
                visit.vouchersGenerated?.length
                  ? "bg-white text-black shadow-white/10"
                  : "bg-white/5 text-white/10 cursor-not-allowed"
              )}
            >
              <QrCode size={24} strokeWidth={2.5} />
              <span>Confirmar Vouchers</span>
            </button>

            <button
              onClick={() => setStep('ACTIVE')}
              className="text-white/20 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Voltar ao formulário
            </button>
          </div>
        )}

        {step === 'QR_CODE' && (
          <div className="space-y-12 animate-in zoom-in-95 duration-700 text-center py-10">
            <div className="space-y-2">
              <div className="inline-flex p-3 bg-emerald-500/20 text-emerald-500 rounded-2xl mb-4">
                <QrCode size={32} strokeWidth={1.5} />
              </div>
              <h4 className="text-3xl font-black text-white tracking-tighter">Resgate Pronto!</h4>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">Mostre este código para o responsável<br />da academia ou envie o link.</p>
            </div>

            <div className="relative inline-block group">
              <div className="absolute -inset-8 bg-emerald-500/10 blur-[60px] rounded-full animate-pulse transition-all group-hover:bg-emerald-500/20"></div>
              <div className="relative bg-white p-6 rounded-[3rem] shadow-2xl border-[6px] border-emerald-500/10 transition-transform duration-700 hover:rotate-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateShareLink())}`}
                  alt="Voucher QR Code"
                  className="w-56 h-56 mx-auto mix-blend-multiply"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                onClick={() => {
                  const landingText = `Obrigado por fazer parte BJJVisits! 🥋\n\nSua academia (${academy.name}) recebeu ${visit.vouchersGenerated?.length} vouchers:\n${visit.vouchersGenerated?.join(', ')}\n\nLink para resgate:\n${generateShareLink()}`;
                  navigator.clipboard.writeText(landingText);
                  toast.success("Copiado para o WhatsApp!", {
                    icon: <MessageCircle size={16} className="text-emerald-500" />
                  });
                }}
                className="bg-white/5 border border-white/10 text-white/60 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-white/10"
              >
                <MessageCircle size={16} />
                <span>Zap Texto</span>
              </button>
              <button
                onClick={() => window.open(generateShareLink(), '_blank')}
                className="bg-white/5 border border-white/10 text-white/60 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-white/10"
              >
                <ExternalLink size={16} />
                <span>Ver Landing</span>
              </button>
            </div>

            <button
              onClick={() => onFinish(visit)}
              className="w-full h-20 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-emerald-500/40 active:scale-[0.98] transition-all"
            >
              Concluir Visita
            </button>
          </div>
        )}

        {step === 'SUMMARY' && (
          <div className="space-y-2 animate-in slide-in-from-bottom-10 duration-700">
            <div className="flex flex-col items-center justify-center space-y-1 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150"></div>
                <div className="relative w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-xl overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <CheckCircle2 size={48} strokeWidth={2.5} className="animate-in zoom-in-50 duration-500" />
                </div>
              </div>
              <div>
                <h4 className="text-3xl font-black text-white tracking-tighter">Visitado 🏁</h4>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">Registro persistido no sistema</p>
              </div>
            </div>

            <div className="space-y-4 pl-8 border-l-2 border-emerald-500/10 relative mx-2">
              {/* Timeline Items refined */}
              <div className="relative">
                <div className="absolute -left-[39px] top-1.5 w-4 h-4 bg-[#0a0a0a] border-4 border-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"></div>
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Resumo da Atividade</span>
                  <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-black text-white/20 tracking-widest">Contato</span>
                        <p className="text-sm font-black text-white/90">{visit.contactPerson}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-black text-white/20 tracking-widest">Temperatura</span>
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            visit.temperature === AcademyTemperature.HOT ? 'bg-red-500' : visit.temperature === AcademyTemperature.WARM ? 'bg-amber-500' : 'bg-blue-500'
                          )}></div>
                          <span className={cn(
                            "text-xs font-black uppercase tracking-tight",
                            visit.temperature === AcademyTemperature.HOT ? 'text-red-400' : visit.temperature === AcademyTemperature.WARM ? 'text-amber-400' : 'text-blue-400'
                          )}>
                            {visit.temperature}
                          </span>
                        </div>
                      </div>
                    </div>
                    {visit.summary && (
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[9px] uppercase font-black text-white/20 tracking-widest">Observações</span>
                        <p className="text-xs text-white/60 leading-relaxed italic mt-2">"{visit.summary}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos & Items */}
              <div className="relative">
                <div className="absolute -left-[39px] top-1.5 w-4 h-4 bg-[#0a0a0a] border-4 border-white/10 rounded-full"></div>
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Evidências & Marketing</span>
                  <div className="flex flex-wrap gap-2">
                    {visit.leftBanner && <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">Banner 🚩</div>}
                    {visit.leftFlyers && <div className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">Flyers 📄</div>}
                    {visit.photos?.map((p, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                        <img src={p} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Final Actions */}
            <div className="pt-8 pb-12">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleStartEdit}
                  className="bg-white/5 border border-white/10 text-white/60 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                >
                  Refazer/Editar
                </button>
                <button
                  onClick={() => onCancel()}
                  className="bg-emerald-600 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-emerald-500/40"
                >
                  Fechar
                </button>
              </div>
            </div>
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
                        {person === ContactPerson.OWNER ? 'Proprietário' :
                          person === ContactPerson.TEACHER ? 'Professor' :
                            person === ContactPerson.STAFF ? 'Secretaria' : 'Ninguém'}
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                      Resumo da Visita <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(opcional)</span>
                    </label>
                    <WhatsAppVoiceMic onTranscript={(text) => setEditedVisit(p => ({ ...p, summary: (p.summary ? p.summary + ' ' : '') + text }))} />
                  </div>
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

                {/* Fotos da Visita */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                      Fotos <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(opcional - até 3)</span>
                    </span>
                    <span className="text-[10px] text-neutral-500">{(editedVisit.photos?.length || 0)}/3</span>
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {editedVisit.photos?.map((photo, index) => (
                      <div key={index} className="relative w-20 h-20 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 shadow-inner group">
                        <img src={photo} alt={`Visit ${index}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setEditedVisit(p => ({ ...p, photos: p.photos?.filter((_, i) => i !== index) }))}
                          className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(editedVisit.photos?.length || 0) < 3 && (
                      <label className="w-20 h-20 bg-neutral-800/50 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-800 hover:border-emerald-500/30 transition-all group">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <Loader2 size={20} className="text-emerald-500 animate-spin" />
                        ) : (
                          <>
                            <Camera size={20} className="text-neutral-600 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[9px] text-neutral-600 group-hover:text-emerald-500 mt-1">Adicionar</span>
                          </>
                        )}
                      </label>
                    )}
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
                    className="flex-1 h-12 bg-white/5 text-white/40 rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
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
      <main className={cn(
        "flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-500",
        currentUser.role === UserRole.SALES ? "bg-[#0a0a0a]" : "bg-neutral-900",
        isElevated ? "pt-24" : ""
      )}>
        {/* Background Decorative Gradient - Mobile Only */}
        {currentUser.role === UserRole.SALES && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-zinc-500/5 blur-[120px] rounded-full"></div>
          </div>
        )}

        {/* Header Logic */}
        {currentUser.role === UserRole.ADMIN ? (
          <Navbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeTab={activeTab}
            onOpenElevationPrompt={() => setShowElevationPrompt(true)}
          />
        ) : activeTab !== 'visit_detail' ? (
          /* Premium Salesperson Header - Native Feel */
          <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 transition-transform active:scale-95 cursor-default">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                <img src="/oss_logo.jpg" alt="Logo" className="w-full h-full object-contain mix-blend-screen filter invert hue-rotate-180 brightness-150 contrast-125" />
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-tight leading-none italic">BJJVisits</h1>
                <p className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest mt-0.5">Live Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-xs font-black text-white/90 leading-none">{currentUser.name}</p>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-1">Consultor</p>
              </div>
            </div>
          </header>
        ) : null}

        <div className={cn(
          "flex-1 overflow-y-auto relative z-10 custom-scrollbar",
          currentUser.role === UserRole.SALES ? "p-4 pb-44" : "p-4 md:p-6 lg:p-8"
        )}>
          {/* Real-time Toast System (Success/Info/Error for the actor) */}
          {globalToast && (
            <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 z-[200] animate-in slide-in-from-top-4 duration-500">
              <div className={cn(
                "p-4 rounded-[1.5rem] shadow-2xl border backdrop-blur-xl flex items-center space-x-3",
                globalToast.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                  globalToast.type === 'error' ? "bg-red-500/20 border-red-500/30 text-red-400" :
                    "bg-zinc-800 border-white/10 text-white"
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
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="flex items-center space-x-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5 group-hover:scale-110 transition-transform">
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

