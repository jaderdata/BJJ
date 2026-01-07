import React, { useState } from 'react';
import { supabase } from '../lib/supabase.ts';
import { UserRole } from '../types.ts';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldCheck, Briefcase } from 'lucide-react';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.SALES);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            role,
                        },
                    },
                });
                if (signUpError) throw signUpError;
                alert('Check your email for the confirmation link!');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 text-white shadow-2xl mb-6 transform hover:rotate-6 transition-transform">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">BJJVisits</h1>
                    <p className="text-slate-400 mt-2 font-medium">Official Visit Management System</p>
                </div>

                <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-2xl space-y-8 relative overflow-hidden">
                    {/* Subtle gradient overlay */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                    <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700/50">
                        <button
                            onClick={() => setIsSignUp(false)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${!isSignUp ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <LogIn size={18} />
                            <span>Login</span>
                        </button>
                        <button
                            onClick={() => setIsSignUp(true)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${isSignUp ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <UserPlus size={18} />
                            <span>Sign Up</span>
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-900/30 border border-red-800/50 rounded-2xl text-red-400 text-xs font-bold animate-in fade-in zoom-in-95">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {isSignUp && (
                                <>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Full Name"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setRole(UserRole.SALES)}
                                            className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center space-x-2 ${role === UserRole.SALES ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                                        >
                                            <Briefcase size={14} />
                                            <span>Sales Role</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRole(UserRole.ADMIN)}
                                            className={`flex-1 py-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center space-x-2 ${role === UserRole.ADMIN ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:bg-slate-800'}`}
                                        >
                                            <ShieldCheck size={14} />
                                            <span>Admin Role</span>
                                        </button>
                                    </div>
                                </>
                            )}

                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    required
                                    type="email"
                                    placeholder="Email Address"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    required
                                    type="password"
                                    placeholder="Password"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-blue-600 text-white rounded-[1.25rem] font-bold shadow-xl shadow-blue-900/40 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Create Account' : 'Verify Identity'}</span>
                                    <ShieldCheck size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    {!isSignUp && (
                        <div className="pt-4 text-center">
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Authorized Access Only</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
