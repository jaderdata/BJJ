
import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarDays, X, CheckCircle2, Clock, Plus, Minus, AlertCircle, ChevronRight, ChevronLeft,
  Ticket, Info, Bell, Search, Edit3, Camera, Trash2, RefreshCw, QrCode, Copy, ExternalLink,
  History, TrendingUp, MessageCircle, Phone, Save, Loader2, Play, Image as ImageIcon,
  Upload, Mic, Send, Lock, Share2, Smartphone, Sparkles, Wand2
} from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
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

export const VisitDetail: React.FC<{ eventId: string, academy: Academy, event: Event, existingVisit?: Visit, onFinish: any, onStart: any, onCancel: any }> = ({ eventId, academy, event, existingVisit, onFinish, onStart, onCancel }) => {
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
  const [isRefining, setIsRefining] = useState(false);
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
      console.log("?? Salvando visita - Dados atuais:", visit);
      console.log("?? Alterações:", editedVisit);

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

      console.log("?? Dados a serem salvos:", updatedVisit);

      const result = await DatabaseService.upsertVisit(updatedVisit);
      console.log("? Resultado do salvamento:", result);

      setVisit(result);
      setIsEditingVisit(false);

      // Propagar mudanças para o componente pai
      await onFinish(result);

      toast.success("Visita atualizada com sucesso!");
    } catch (error: any) {
      console.error("? [App] Error updating visit FULL OBJECT:", error);
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Erro ao atualizar: ${errorMessage}`);
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

  const handleRefineSummary = async () => {
    if (!visit.summary || visit.summary.trim().length < 5) {
      toast.info("Escreva um pouco mais para que eu possa refinar o texto.");
      return;
    }

    setIsRefining(true);
    try {
      const refined = await DatabaseService.refineVoiceText(visit.summary);
      if (refined) {
        setVisit(p => ({ ...p, summary: refined }));
        toast.success("Texto refinado!");
      }
    } catch (error) {
      console.error("Error refining text:", error);
      toast.error("Erro ao refinar o texto.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleRefineEditedSummary = async () => {
    if (!editedVisit.summary || editedVisit.summary.trim().length < 5) {
      toast.info("Escreva um pouco mais para que eu possa refinar o texto.");
      return;
    }

    setIsRefining(true);
    try {
      const refined = await DatabaseService.refineVoiceText(editedVisit.summary);
      if (refined) {
        setEditedVisit(p => ({ ...p, summary: refined }));
        toast.success("Texto refinado!");
      }
    } catch (error) {
      console.error("Error refining text:", error);
      toast.error("Erro ao refinar o texto.");
    } finally {
      setIsRefining(false);
    }
  };

  // Validação e ir para tela de vouchers
  const handleGenerateVoucher = () => {
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

  const getShareMessage = () => {
    const count = visit.vouchersGenerated?.length || 0;
    const codes = visit.vouchersGenerated?.join(', ') || '';
    const shareLink = generateShareLink();

    return `Thank you for being part of BJJVisits!\n\n` +
      `Your academy (${academy.name}) has received ${count} voucher${count > 1 ? 's' : ''}:\n` +
      `${codes}\n\n` +
      `Follow these steps to redeem:\n` +
      `Step 1: Click on the link below\n` +
      `Step 2: Choose your preferred contact method (WhatsApp or SMS)\n` +
      `Step 3: Send the generated message\n` +
      `Step 4: Wait for our team's response\n\n` +
      `Redemption link:\n${shareLink}`;
  };

  const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

  const handleShareWhatsApp = async () => {
    const text = getShareMessage();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Voucher - BJJVisits',
          text: text
        });
        return;
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }

    // Generic fallback if navigator.share is unavailable or fails
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(getShareMessage());
    const phone = academy.phone ? cleanPhone(academy.phone) : '';
    const url = `sms:${phone}?body=${text}`;
    window.location.href = url;
  };

  const steps = [
    { id: 'START', label: 'Início', icon: <Play size={12} /> },
    { id: 'ACTIVE', label: 'Atendimento', icon: <Edit3 size={12} /> },
    { id: 'VOUCHERS', label: 'Vouchers', icon: <Ticket size={12} /> },
    { id: 'QR_CODE', label: 'Resgate', icon: <QrCode size={12} /> },
    { id: 'SUMMARY', label: 'Resumo', icon: <CheckCircle2 size={12} /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const handleStepClick = (newStep: string) => {
    // If navigating away from START, ensure the visit has legally started
    if (step === 'START' && newStep !== 'START' && !visit.startedAt) {
      const startDetails = {
        ...visit,
        startedAt: new Date().toISOString(),
        status: VisitStatus.PENDING
      };
      setVisit(startDetails);
      onStart(startDetails);
    }
    setIsEditingVisit(false);
    setStep(newStep as any);
  };

  return (<div className="relative z-[100]">
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
            <div
              key={s.id}
              onClick={() => handleStepClick(s.id)}
              className="flex flex-col items-center space-y-1 relative flex-1 cursor-pointer group/step"
            >
              <div className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-500 relative z-10 active:scale-90",
                idx <= currentStepIndex ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-white/20 border border-white/5 group-hover/step:bg-white/10 group-hover/step:text-white/40"
              )}>
                {idx < currentStepIndex ? <CheckCircle2 size={10} strokeWidth={3} /> : s.icon}
              </div>
              <span className={cn(
                "text-[7px] font-black uppercase tracking-tighter transition-colors duration-500",
                idx <= currentStepIndex ? "text-emerald-500" : "text-white/10 group-hover/step:text-white/30"
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
                  {visit.summary && visit.summary.trim().length > 0 && (
                    <button
                      onClick={handleRefineSummary}
                      disabled={isRefining}
                      className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider">{isRefining ? 'Refinando...' : 'Refinar'}</span>
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    placeholder="Quais os pontos principais desta visita? Algo importante para o futuro?"
                    className="relative w-full min-h-[9rem] bg-white/[0.03] text-white p-6 rounded-[2rem] text-sm outline-none transition-all placeholder:text-white/10 border border-white/5 focus:border-emerald-500/30 focus:bg-white/[0.05] overflow-hidden resize-none"
                    value={visit.summary}
                    maxLength={500}
                    onChange={e => {
                      setVisit(p => ({ ...p, summary: e.target.value }));
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  <div className="absolute bottom-4 right-6 text-[10px] font-black text-white/20 pointer-events-none">
                    {visit.summary?.length || 0}/500
                  </div>
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
                  className="flex-[2] bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl flex items-center justify-center"
                >
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

            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <button
                onClick={handleShareWhatsApp}
                className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-emerald-600/20"
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleShareSMS}
                className="bg-sky-600/10 border border-sky-500/20 text-sky-400 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-sky-600/20"
              >
                <Smartphone size={14} />
                <span>SMS Direct</span>
              </button>

              <button
                onClick={() => window.open(generateShareLink(), '_blank')}
                className="col-span-2 bg-white/5 border border-white/10 text-white/40 mb-2 py-3 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-white/10"
              >
                <ExternalLink size={12} />
                <span>Acessar Landing Page</span>
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
                        <img src={p} alt={`Visit Photo ${i + 1}`} className="w-full h-full object-cover" />
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
      </div>
    </div>


    {
      isEditingVisit && (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[70] flex flex-col animate-in slide-in-from-bottom duration-300 antialiased selection:bg-emerald-500/30 select-none overflow-y-auto custom-scrollbar">
          {/* Header Fixo do Modo Edição */}
          <div className="sticky top-0 bg-black/60 backdrop-blur-2xl p-6 border-b border-white/5 z-50 flex items-center justify-between shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-sky-500 rounded-full"></div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight uppercase italic text-sky-500">Modo de Edição</h3>
                <p className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.2em]">{academy.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTimeInfo(true)}
                className="p-2 text-neutral-400 hover:text-sky-400 transition-colors bg-white/5 rounded-xl border border-white/5"
                title="Informações sobre horários"
              >
                <Info size={18} />
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-white/5 p-2 rounded-xl text-neutral-400 hover:text-white transition-colors border border-white/5 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-10 pb-32">
            <div className="space-y-8 max-w-xl mx-auto">
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
                  ].map(temp => (
                    <button
                      key={temp.value}
                      onClick={() => setEditedVisit(p => ({ ...p, temperature: temp.value }))}
                      className={`py-4 rounded-2xl font-bold transition-all border text-[10px]uppercase tracking-tighter ${editedVisit.temperature === temp.value
                        ? temp.value === AcademyTemperature.HOT ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' :
                          temp.value === AcademyTemperature.WARM ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
                            'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-600/20'
                        : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                        }`}
                    >
                      {temp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Materiais */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  Materiais
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEditedVisit(p => ({ ...p, leftBanner: !p.leftBanner }))}
                    className={`py-4 rounded-2xl font-bold transition-all border text-xs ${editedVisit.leftBanner
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-800/50 text-neutral-500 border-white/5'
                      }`}
                  >
                    Deixei Banner 🚩
                  </button>
                  <button
                    onClick={() => setEditedVisit(p => ({ ...p, leftFlyers: !p.leftFlyers }))}
                    className={`py-4 rounded-2xl font-bold transition-all border text-xs ${editedVisit.leftFlyers
                      ? 'bg-sky-600/20 text-sky-400 border-sky-500/30'
                      : 'bg-neutral-800/50 text-neutral-500 border-white/5'
                      }`}
                  >
                    Deixei Flyers 📄
                  </button>
                </div>
              </div>

              {/* Resumo */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    Resumo da Visita <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(opcional)</span>
                  </label>
                  {editedVisit.summary && editedVisit.summary.trim().length > 0 && (
                    <button
                      onClick={handleRefineEditedSummary}
                      disabled={isRefining}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider">{isRefining ? 'Refinando...' : 'Refinar'}</span>
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <textarea
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    value={editedVisit.summary || ''}
                    onChange={(e) => {
                      setEditedVisit(p => ({ ...p, summary: e.target.value }));
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    maxLength={500}
                    rows={1}
                    placeholder="Resumo geral da visita..."
                    className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all min-h-[120px] custom-scrollbar resize-none overflow-hidden"
                  />
                  <div className="absolute bottom-3 right-8 text-[10px] font-black text-white/20 pointer-events-none">
                    {editedVisit.summary?.length || 0}/500
                  </div>
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 size={14} className="text-white/20" />
                  </div>
                </div>
              </div>

              {/* Fotos */}
              <div className="space-y-3 text-left">
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
      )
    }
  </div>
  );
};
