import React, { useState, useEffect } from 'react';
import { AuthService } from '../lib/supabase';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

type AuthView = 'LOGIN' | 'REQUEST_ACCESS' | 'ACTIVATE' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

const CustomAuth: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
    const [view, setView] = useState<AuthView>('LOGIN');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Token from URL
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Check for URL parameters for Activation or Reset
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const type = params.get('type'); // 'activation' or 'reset'

        if (urlToken) {
            console.log("Token detected in URL:", urlToken, type);
            setToken(urlToken);
            if (type === 'activation') {
                setView('ACTIVATE');
            } else if (type === 'reset') {
                setView('RESET_PASSWORD');
            }
            // Optional: Clean URL only after successful state set
            // window.history.replaceState({}, '', window.location.pathname); 
        }
    }, []);

    const clearForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        setMessage(null);
        setShowPassword(false);
    };

    const handleSwitch = (newView: AuthView) => {
        clearForm();
        setView(newView);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            let result;
            const normalizedEmail = email.trim().toLowerCase();

            switch (view) {
                case 'LOGIN':
                    result = await AuthService.login(normalizedEmail, password);
                    if (result.success && result.user) {
                        onLogin(result.user);
                        return; // Successfully logged in
                    }
                    break;

                case 'REQUEST_ACCESS':
                    result = await AuthService.requestAccess(normalizedEmail);
                    break;

                case 'ACTIVATE':
                    if (password !== confirmPassword) {
                        throw new Error("As senhas não coincidem.");
                    }
                    if (password.length < 6 || !/\d/.test(password)) {
                        throw new Error("A senha deve ter no mínimo 6 caracteres e incluir um número.");
                    }
                    if (!token) throw new Error("Token inválido.");
                    result = await AuthService.activateUser(token, password, name);
                    if (result.success) {
                        setTimeout(() => setView('LOGIN'), 3000);
                    }
                    break;

                case 'FORGOT_PASSWORD':
                    result = await AuthService.requestReset(normalizedEmail);
                    break;

                case 'RESET_PASSWORD':
                    if (password !== confirmPassword) {
                        throw new Error("As senhas não coincidem.");
                    }
                    if (!token) throw new Error("Token inválido.");
                    result = await AuthService.executeReset(token, password);
                    if (result.success) {
                        setTimeout(() => setView('LOGIN'), 3000);
                    }
                    break;
            }

            if (result) {
                setMessage({
                    text: result.message,
                    type: result.success ? 'success' : 'error'
                });
            }

        } catch (error: any) {
            setMessage({
                text: error.message || 'Ocorreu um erro inesperado.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Render Components based on View
    return (
        <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8 animate-in slide-in-from-top-4 flex flex-col items-center">
                    <img
                        src="/oss_logo.jpg"
                        alt="OSS Logo"
                        className="w-48 h-auto mb-4 object-contain mix-blend-screen pointer-events-none select-none"
                        style={{
                            filter: 'invert(1) hue-rotate(180deg) contrast(1.5)',
                        }}
                    />
                    <h1 className="text-3xl font-black text-white tracking-tight">BJJVisits</h1>
                </div>

                <div className="bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-700 shadow-2xl relative overflow-hidden animate-in zoom-in-95">

                    {/* View Title */}
                    <h2 className="text-xl font-bold text-white mb-6 text-center">
                        {view === 'LOGIN' && 'Acessar Sistema'}
                        {view === 'REQUEST_ACCESS' && 'Solicitar Acesso'}
                        {view === 'ACTIVATE' && 'Ativar Conta'}
                        {view === 'FORGOT_PASSWORD' && 'Recuperar Senha'}
                        {view === 'RESET_PASSWORD' && 'Nova Senha'}
                    </h2>

                    {message && (
                        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-start space-x-3 aniamte-in fade-in ${message.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' : 'bg-red-900/30 text-red-400 border border-red-800/50'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Fields for ACTIVATE */}
                        {view === 'ACTIVATE' && (
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Seu Nome Completo"
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-700 rounded-2xl text-white focus:border-white outline-none transition-all"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Fields for LOGIN, REQ_ACCESS, FORGOT */}
                        {['LOGIN', 'REQUEST_ACCESS', 'FORGOT_PASSWORD'].includes(view) && (
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                                <input
                                    required
                                    type="email"
                                    placeholder="Seu E-mail"
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-700 rounded-2xl text-white focus:border-white outline-none transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Fields for LOGIN, ACTIVATE, RESET */}
                        {['LOGIN', 'ACTIVATE', 'RESET_PASSWORD'].includes(view) && (
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    placeholder={view === 'LOGIN' ? "Sua Senha" : "Nova Senha (min 6 chars, 1 num)"}
                                    className="w-full pl-12 pr-12 py-4 bg-neutral-900 border border-neutral-700 rounded-2xl text-white focus:border-white outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        )}

                        {/* Confirm Password for ACTIVATE/RESET */}
                        {['ACTIVATE', 'RESET_PASSWORD'].includes(view) && (
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                                <input
                                    required
                                    type="password"
                                    placeholder="Confirme a Senha"
                                    className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-700 rounded-2xl text-white focus:border-white outline-none transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-white text-neutral-900 rounded-[1.25rem] font-bold shadow-xl hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : (
                                <>
                                    <span>
                                        {view === 'LOGIN' && 'Entrar'}
                                        {view === 'REQUEST_ACCESS' && 'Solicitar Acesso'}
                                        {view === 'ACTIVATE' && 'Criar Conta'}
                                        {view === 'FORGOT_PASSWORD' && 'Enviar Link'}
                                        {view === 'RESET_PASSWORD' && 'Salvar Nova Senha'}
                                    </span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Navigation Handlers */}
                    <div className="mt-6 space-y-3 text-center">
                        {view === 'LOGIN' && (
                            <>
                                <button onClick={() => handleSwitch('FORGOT_PASSWORD')} className="block w-full text-neutral-500 hover:text-white text-xs font-bold transition-colors">
                                    Esqueci minha senha
                                </button>
                                <button onClick={() => handleSwitch('REQUEST_ACCESS')} className="block w-full text-neutral-300 hover:text-white text-xs font-bold transition-colors">
                                    Não tem acesso? Solicitar aqui
                                </button>
                            </>
                        )}

                        {(view === 'REQUEST_ACCESS' || view === 'FORGOT_PASSWORD') && (
                            <button onClick={() => handleSwitch('LOGIN')} className="text-neutral-500 hover:text-white text-xs font-bold transition-colors">
                                Voltar para Login
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CustomAuth;
