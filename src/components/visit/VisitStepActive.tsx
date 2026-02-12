
import React, { useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { cn, hapticFeedback } from '../../lib/utils';
import { ContactPerson, AcademyTemperature, Visit, VisitStatus } from '../../types';

interface VisitStepActiveProps {
    visit: Partial<Visit>;
    setVisit: React.Dispatch<React.SetStateAction<Partial<Visit>>>;
    marketingVerified: boolean;
    setMarketingVerified: (val: boolean) => void;
    isUploading: boolean;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleFinishVisit: () => void;
    handleGenerateVoucher: () => void;
    isEditing?: boolean;
}

export const VisitStepActive: React.FC<VisitStepActiveProps> = ({
    visit,
    setVisit,
    marketingVerified,
    setMarketingVerified,
    isUploading,
    handlePhotoUpload,
    handleFinishVisit,
    handleGenerateVoucher,
    isEditing = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateField = (field: keyof Visit, value: any) => {
        hapticFeedback('light');
        setVisit(prev => ({ ...prev, [field]: value }));
    };

    const toggleMarketing = (field: 'leftBanner' | 'leftFlyers') => {
        hapticFeedback('light');
        setVisit(prev => ({ ...prev, [field]: !prev[field] }));
        setMarketingVerified(true);
    };

    const clearMarketing = () => {
        hapticFeedback('medium');
        setVisit(prev => ({ ...prev, leftBanner: false, leftFlyers: false }));
        setMarketingVerified(true);
    };

    return (
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
                            onClick={() => updateField('contactPerson', p.val)}
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
                            onClick={() => updateField('temperature', t.value)}
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
                <div className="flex items-center space-x-2 px-1 mb-2">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Resumo Executivo <span className="text-white/20 text-[9px] font-medium lowercase ml-1">(opcional)</span></label>
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
                                onClick={() => {
                                    hapticFeedback('error');
                                    setVisit(p => ({ ...p, photos: p.photos?.filter((_, i) => i !== index) }));
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>
                    ))}
                    {(visit.photos?.length || 0) < 3 && (
                        <div
                            onClick={() => {
                                if (!isUploading) {
                                    hapticFeedback('light');
                                    fileInputRef.current?.click();
                                }
                            }}
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
                        { key: 'leftBanner' as const, label: 'Banner 🚩', icon: '🚩' },
                        { key: 'leftFlyers' as const, label: 'Flyers 📄', icon: '📄' }
                    ].map(m => (
                        <button
                            key={m.key}
                            onClick={() => toggleMarketing(m.key)}
                            className={cn(
                                "flex-1 group relative overflow-hidden py-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-center space-y-2 active:scale-95",
                                visit[m.key]
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : "bg-white/5 border-white/5 text-white/40"
                            )}
                        >
                            <span className={cn("text-2xl transition-transform duration-500 group-hover:scale-110", visit[m.key] ? "opacity-100" : "opacity-30")}>{m.icon}</span>
                            <span className={cn("text-[10px] font-black uppercase tracking-wider", visit[m.key] ? "text-emerald-400" : "text-white/20")}>{m.label}</span>
                        </button>
                    ))}

                    <button
                        onClick={clearMarketing}
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

            {/* Actions (Only if not in global edit mode - handled by parent) */}
            {!isEditing && (
                <div className="pt-8 pb-12 animate-in fade-in duration-700">
                    <div className="max-w-md mx-auto flex gap-4">
                        <button
                            onClick={() => { hapticFeedback('medium'); handleFinishVisit(); }}
                            className="flex-1 bg-white/5 backdrop-blur-xl text-white/40 border border-white/10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                        >
                            Finalizar
                        </button>
                        <button
                            onClick={() => { hapticFeedback('success'); handleGenerateVoucher(); }}
                            className="flex-[2] bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl flex items-center justify-center"
                        >
                            <span>Gerar Vouchers</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
