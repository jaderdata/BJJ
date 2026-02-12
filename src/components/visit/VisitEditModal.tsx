
import React from 'react';
import { X, Info, Edit3, Camera, Loader2 } from 'lucide-react';
import { cn, hapticFeedback } from '../../lib/utils';
import { Visit, Academy, ContactPerson, AcademyTemperature, VisitStatus } from '../../types';

interface VisitEditModalProps {
    academy: Academy;
    editedVisit: Partial<Visit>;
    setEditedVisit: React.Dispatch<React.SetStateAction<Partial<Visit>>>;
    handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleSaveEditedVisit: () => void;
    handleCancelEdit: () => void;
    handleGenerateVoucherFromModal: () => void;
    handleFinishVisitFromModal: () => void;
    isUploading: boolean;
    hasChanges: () => boolean;
    visit: Partial<Visit>;
    showTimeInfo: boolean;
    setShowTimeInfo: (val: boolean) => void;
}

export const VisitEditModal: React.FC<VisitEditModalProps> = ({
    academy,
    editedVisit,
    setEditedVisit,
    handlePhotoUpload,
    handleSaveEditedVisit,
    handleCancelEdit,
    handleGenerateVoucherFromModal,
    handleFinishVisitFromModal,
    isUploading,
    hasChanges,
    visit,
    showTimeInfo,
    setShowTimeInfo
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const updateField = (field: keyof Visit, value: any) => {
        hapticFeedback('light');
        setEditedVisit(prev => ({ ...prev, [field]: value }));
    };

    return (
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
                        onClick={() => { hapticFeedback('light'); setShowTimeInfo(true); }}
                        className="p-2 text-neutral-400 hover:text-sky-400 transition-colors bg-white/5 rounded-xl border border-white/5"
                    >
                        <Info size={18} />
                    </button>
                    <button
                        onClick={() => { hapticFeedback('light'); handleCancelEdit(); }}
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
                                    onClick={() => updateField('contactPerson', person)}
                                    className={cn(
                                        "py-4 rounded-2xl font-bold transition-all border text-sm active:scale-95",
                                        editedVisit.contactPerson === person
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                                            : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                                    )}
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
                                { value: AcademyTemperature.COLD, label: 'Fria ❄️' },
                                { value: AcademyTemperature.WARM, label: 'Morna 🌤️' },
                                { value: AcademyTemperature.HOT, label: 'Quente 🔥' }
                            ].map(temp => (
                                <button
                                    key={temp.value}
                                    onClick={() => updateField('temperature', temp.value)}
                                    className={cn(
                                        "py-4 rounded-2xl font-bold transition-all border text-[10px] uppercase tracking-tighter active:scale-95",
                                        editedVisit.temperature === temp.value
                                            ? temp.value === AcademyTemperature.HOT ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' :
                                                temp.value === AcademyTemperature.WARM ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' :
                                                    'bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-600/20'
                                            : 'bg-neutral-800/50 text-neutral-500 border-white/5 hover:bg-neutral-800'
                                    )}
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
                                onClick={() => updateField('leftBanner', !editedVisit.leftBanner)}
                                className={cn(
                                    "py-4 rounded-2xl font-bold transition-all border text-xs active:scale-95",
                                    editedVisit.leftBanner
                                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-neutral-800/50 text-neutral-500 border-white/5'
                                )}
                            >
                                Deixei Banner 🚩
                            </button>
                            <button
                                onClick={() => updateField('leftFlyers', !editedVisit.leftFlyers)}
                                className={cn(
                                    "py-4 rounded-2xl font-bold transition-all border text-xs active:scale-95",
                                    editedVisit.leftFlyers
                                        ? 'bg-sky-600/20 text-sky-400 border-sky-500/30'
                                        : 'bg-neutral-800/50 text-neutral-500 border-white/5'
                                )}
                            >
                                Deixei Flyers 📄
                            </button>
                        </div>
                    </div>

                    {/* Resumo */}
                    <div className="space-y-3 text-left">
                        <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                            Resumo da Visita <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(opcional)</span>
                        </label>
                        <div className="relative group">
                            <textarea
                                value={editedVisit.summary || ''}
                                onChange={(e) => setEditedVisit(p => ({ ...p, summary: e.target.value }))}
                                maxLength={500}
                                placeholder="Resumo geral da visita..."
                                className="w-full bg-neutral-900 border border-white/10 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all min-h-[120px] resize-none"
                            />
                            <div className="absolute bottom-3 right-4 text-[10px] font-black text-white/20">
                                {editedVisit.summary?.length || 0}/500
                            </div>
                        </div>
                    </div>

                    {/* Fotos */}
                    <div className="space-y-3 text-left">
                        <label className="text-sm font-bold text-emerald-500 uppercase tracking-widest flex items-center justify-between">
                            <span className="flex items-center">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                                Fotos <span className="text-neutral-500 text-[10px] font-normal lowercase ml-1">(até 3)</span>
                            </span>
                            <span className="text-[10px] text-neutral-500">{(editedVisit.photos?.length || 0)}/3</span>
                        </label>
                        <div className="flex gap-3 flex-wrap">
                            {editedVisit.photos?.map((photo, index) => (
                                <div key={index} className="relative w-20 h-20 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 group">
                                    <img src={photo} alt="Visit detail" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => { hapticFeedback('error'); setEditedVisit(p => ({ ...p, photos: p.photos?.filter((_, i) => i !== index) })); }}
                                        className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {(editedVisit.photos?.length || 0) < 3 && (
                                <label className="w-20 h-20 bg-neutral-800/50 border-2 border-dashed border-neutral-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-800 hover:border-emerald-500/30 transition-all">
                                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                                    {isUploading ? <Loader2 size={20} className="text-emerald-500 animate-spin" /> : <Camera size={20} className="text-neutral-600" />}
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botões do modal */}
                <div className="mt-10 space-y-4 max-w-xl mx-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { hapticFeedback('success'); handleSaveEditedVisit(); }}
                            disabled={!hasChanges()}
                            className={cn(
                                "h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95",
                                hasChanges() ? 'bg-sky-600 text-white shadow-lg' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                            )}
                        >
                            Salvar Alterações
                        </button>
                        <button
                            onClick={() => { hapticFeedback('light'); handleCancelEdit(); }}
                            className="h-14 bg-neutral-800 text-white rounded-2xl font-medium active:scale-95 border border-white/5"
                        >
                            Cancelar
                        </button>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                        <button
                            onClick={() => { hapticFeedback('medium'); handleGenerateVoucherFromModal(); }}
                            className="flex-1 h-12 bg-white/5 text-white/40 rounded-2xl font-bold border border-white/5 text-xs uppercase tracking-widest active:scale-95"
                        >
                            Gerar Voucher
                        </button>

                        {(!visit.finishedAt || visit.status !== VisitStatus.VISITED) && (
                            <button
                                onClick={() => { hapticFeedback('success'); handleFinishVisitFromModal(); }}
                                className="flex-1 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl font-bold border border-emerald-500/20 text-xs uppercase tracking-widest active:scale-95"
                            >
                                Finalizar Visita
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal de Informação de Horário */}
                {showTimeInfo && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowTimeInfo(false)}>
                        <div className="bg-neutral-900 border border-amber-500/30 rounded-3xl p-6 max-w-xs w-full shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center">
                                    <Info size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-white font-bold">Registro de Horários</h4>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Os horários de <strong>início</strong> e <strong>fim</strong> são registrados automaticamente e não podem ser alterados.
                                    </p>
                                </div>
                                <button onClick={() => setShowTimeInfo(false)} className="w-full bg-neutral-800 text-white py-3 rounded-xl font-bold">Entendi</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
