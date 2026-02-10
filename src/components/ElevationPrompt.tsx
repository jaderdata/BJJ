import React, { useState } from 'react';
import { Shield, Lock, Clock, AlertTriangle, X } from 'lucide-react';

interface ElevationPromptProps {
    onElevate: (password: string, reason: string) => Promise<{ success: boolean; message: string }>;
    onCancel: () => void;
    userName: string;
}

const ElevationPrompt: React.FC<ElevationPromptProps> = ({ onElevate, onCancel, userName }) => {
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await onElevate(password, reason);
            if (!result.success) {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao elevar privilégios');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95">
                {/* Header */}
                <div className="p-6 border-b border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                <Shield className="text-amber-500" size={24} strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Elevação de Privilégios</h2>
                                <p className="text-xs text-neutral-400 mt-0.5">Autenticação adicional necessária</p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-neutral-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Warning */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3">
                        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-amber-400">Modo Administrativo</p>
                            <p className="text-xs text-amber-300/70 mt-1">
                                Você está prestes a ativar privilégios administrativos temporários.
                                Esta ação será auditada.
                            </p>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-neutral-800/50 rounded-xl p-3 border border-neutral-700">
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Usuário</p>
                        <p className="text-sm font-bold text-white">{userName}</p>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white flex items-center">
                            <Lock size={14} className="mr-1.5" />
                            Confirme sua senha
                        </label>
                        <input
                            type="password"
                            required
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        />
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white flex items-center">
                            <Clock size={14} className="mr-1.5" />
                            Motivo da elevação <span className="text-neutral-500 text-xs ml-1">(recomendado)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Gerenciar usuários, ajustar configurações críticas..."
                            rows={3}
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder:text-neutral-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Duration Info */}
                    <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-3 flex items-center space-x-3">
                        <Clock size={16} className="text-neutral-400" />
                        <div>
                            <p className="text-xs font-bold text-neutral-300">Duração da Sessão</p>
                            <p className="text-xs text-neutral-500 mt-0.5">30 minutos (renovável)</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <Shield size={16} />
                                    <span>Elevar Privilégios</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ElevationPrompt;
