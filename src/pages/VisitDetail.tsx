
import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Ticket, Edit3, QrCode, Play } from 'lucide-react';
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
import { cn, generateVoucherCode, hapticFeedback } from '../lib/utils';
import { useLoading } from '../contexts/LoadingContext';

// Novas importações de sub-componentes
import { VisitStepStart } from '../components/visit/VisitStepStart';
import { VisitStepActive } from '../components/visit/VisitStepActive';
import { VisitStepVouchers } from '../components/visit/VisitStepVouchers';
import { VisitStepQrCode } from '../components/visit/VisitStepQrCode';
import { VisitStepSummary } from '../components/visit/VisitStepSummary';
import { VisitEditModal } from '../components/visit/VisitEditModal';
import { ConfirmationModal } from '../components/ConfirmationModal';



export const VisitDetail: React.FC<{ eventId: string, academy: Academy, event: Event, existingVisit?: Visit, onFinish: any, onStart: (v: Partial<Visit>) => Promise<Visit | void>, onCancel: any }> = ({ eventId, academy, event, existingVisit, onFinish, onStart, onCancel }) => {
  const { withLoading } = useLoading();
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
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);


  // -- ROBUSTNESS: Local Storage Backup --
  const STORAGE_KEY = `visit_backup_${eventId}_${academy.id}`;

  useEffect(() => {
    // 1. Restore from backup if exists
    const backup = localStorage.getItem(STORAGE_KEY);
    if (backup) {
      try {
        const parsed = JSON.parse(backup);
        // Only restore if it's recent (less than 24h)
        const backupDate = new Date(parsed._timestamp || 0);
        if (Date.now() - backupDate.getTime() < 86400000) {

          // Se já existe uma visita no servidor, só restauramos o resumo se o do servidor estiver vazio
          if (existingVisit) {
            if (!existingVisit.summary && parsed.summary) {
              console.log("♻️ [VisitDetail] Mesclando resumo do backup local (servidor estava vazio)");
              setVisit(prev => ({
                ...prev,
                summary: `[RESTAURAÇÃO AUTOMÁTICA] ${parsed.summary}\n\n${prev.summary || ''}`.trim()
              }));
              toast.info("Resumo recuperado do backup local.");
            }
          } else {
            // Caso contrário, restaura tudo
            console.log("♻️ [VisitDetail] Restaurando visita completa do backup local");
            setVisit(prev => ({ ...prev, ...parsed }));
            if (parsed.startedAt) setStep('ACTIVE');
            toast.info("Dados da visita anterior restaurados.");
          }
        }
      } catch (e) {
        console.error("Failed to restore backup", e);
      }
    }
  }, [eventId, academy.id, !!existingVisit]); // Usar !! para evitar triggers circulares

  useEffect(() => {
    // 2. Save to backup on every change (incluindo summary)
    if (visit && (visit.startedAt || visit.summary || visit.photos?.length)) {
      const payload = { ...visit, _timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }, [visit, STORAGE_KEY]);

  const clearBackup = () => {
    console.log("🧹 [VisitDetail] Limpando backup local");
    localStorage.removeItem(STORAGE_KEY);
  };
  // -------------------------------------
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

    await withLoading(async () => {
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
    });
  };


  const handleStartVisit = async () => {
    const startDetails = {
      ...visit,
      startedAt: new Date().toISOString(),
      status: VisitStatus.PENDING
    };

    await withLoading(async () => {
      try {
        const savedVisit = await onStart(startDetails);
        if (savedVisit) setVisit(savedVisit);
        else setVisit(startDetails);
        setStep('ACTIVE');
      } catch (error) {
        console.error("Error starting visit:", error);
        toast.error("Erro ao iniciar visita.");
      }
    });
  };


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

    await withLoading(async () => {
      try {
        await onFinish(visitToSave);
        clearBackup(); // Limpar backup após sucesso
      } catch (error) {
        console.error("Error finishing visit:", error);
        toast.error("Erro ao finalizar visita. Por favor, tente novamente.");
      }
    });
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

    await withLoading(async () => {
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
    });
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

    await withLoading(async () => {
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
        clearBackup(); // Limpar backup após sucesso
        toast.success("Visita finalizada com sucesso!");

        // Chamar callback de finalização
        await onFinish(visitToFinalize);
      } catch (error) {
        console.error("Error finishing visit:", error);
        toast.error("Erro ao finalizar visita.");
      }
    });
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
    hapticFeedback('light');
    setStep(newStep as any);
  };

  const handleCancelClick = () => {
    hapticFeedback('medium');
    if (step === 'ACTIVE' || step === 'VOUCHERS') {
      setShowConfirmCancel(true);
    } else {
      onCancel();
    }
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
              hapticFeedback('medium');
              if (visit.status === VisitStatus.VISITED || step === 'SUMMARY' || step === 'QR_CODE' || step === 'START') {
                onCancel();
              } else {
                setShowConfirmCancel(true);
              }
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
            <VisitStepStart onStart={handleStartVisit} />
          )}

          {step === 'ACTIVE' && (
            <VisitStepActive
              visit={visit}
              setVisit={setVisit}
              marketingVerified={marketingVerified}
              setMarketingVerified={setMarketingVerified}
              isUploading={isUploading}
              handlePhotoUpload={handlePhotoUpload}
              handleFinishVisit={handleFinishVisit}
              handleGenerateVoucher={handleGenerateVoucher}
            />
          )}


        </div>

        {step === 'VOUCHERS' && (
          <VisitStepVouchers
            vouchers={visit.vouchersGenerated || []}
            adjust={adjust}
            handleFinishWithQr={handleFinishWithQr}
            setStep={setStep}
          />
        )}

        {step === 'QR_CODE' && (
          <VisitStepQrCode
            generateShareLink={generateShareLink}
            handleShareWhatsApp={handleShareWhatsApp}
            handleShareSMS={handleShareSMS}
            onFinish={onFinish}
            visit={visit}
          />
        )}

        {step === 'SUMMARY' && (
          <VisitStepSummary
            visit={visit}
            handleStartEdit={handleStartEdit}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>


    {/* Edit Modal (Step Contextual) */}
    {isEditingVisit && (
      <VisitEditModal
        academy={academy}
        visit={visit}
        editedVisit={editedVisit}
        setEditedVisit={setEditedVisit}
        handlePhotoUpload={handlePhotoUpload}
        handleSaveEditedVisit={handleSaveEditedVisit}
        handleCancelEdit={handleCancelEdit}
        handleGenerateVoucherFromModal={handleGenerateVoucherFromModal}
        handleFinishVisitFromModal={handleFinishVisitFromModal}
        isUploading={isUploading}
        hasChanges={hasChanges}
        showTimeInfo={showTimeInfo}
        setShowTimeInfo={setShowTimeInfo}
      />
    )}

    <ConfirmationModal
      isOpen={showConfirmCancel}
      onCancel={() => setShowConfirmCancel(false)}
      onConfirm={() => {
        setShowConfirmCancel(false);
        onCancel();
      }}
      title="Cancelar Visita?"
      message="Se sair agora, você poderá perder os dados desta visita se não tiver salvo."
      confirmLabel="Sair"
      cancelLabel="Continuar"
      type="danger"
    />
  </div >
  );
};
