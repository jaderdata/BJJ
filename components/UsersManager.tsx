import React, { useState, useEffect } from 'react';
import {
    Trash2,
    X,
    Mail,
    Shield,
    Edit3,
    Send,
    Copy,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import { User, UserRole } from '../types';
import { DatabaseService, AuthService } from '../lib/supabase';

interface UsersManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
    notifyUser: (uid: string, msg: string) => void;
}

export const UsersManager: React.FC<UsersManagerProps> = ({
    users,
    setUsers,
    currentUser,
    notifyUser
}) => {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({ role: UserRole.SALES });
    const [loading, setLoading] = useState(false);

    // Invite State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.SALES);
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);

    useEffect(() => {
        loadPendingInvites();
    }, []);

    const loadPendingInvites = async () => {
        try {
            const invites = await DatabaseService.getPendingInvites();
            setPendingInvites(invites);
        } catch (error) {
            console.error("Error loading invites:", error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.role) {
            alert("Preencha todos os campos obrigatórios");
            return;
        }

        setLoading(true);
        try {
            if (editingUser) {
                const updated = await DatabaseService.updateUser(editingUser.id, formData);
                setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                notifyUser(updated.id, `Seu perfil foi atualizado pelo administrador ${currentUser.name}.`);
                alert("Usuário atualizado com sucesso!");
            } else {
                alert("Dica: Use o sistema de convites para novos usuários definirem suas próprias senhas.");
            }
            setShowModal(false);
            setEditingUser(null);
            setFormData({ role: UserRole.SALES });
        } catch (error: any) {
            console.error("Error saving user:", error);
            alert(`Erro ao salvar usuário: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (id === currentUser.id) {
            alert("Você não pode excluir seu próprio usuário");
            return;
        }

        const userToDelete = users.find(u => u.id === id);
        if (!userToDelete) return;

        if (window.confirm(`Deseja realmente excluir o usuário "${name}"?`)) {
            try {
                setLoading(true);
                // 1. Delete from app_users
                await DatabaseService.deleteUser(id);

                // 2. Delete from allowlist so they can be invited/request access again
                await DatabaseService.deleteFromAllowlist(userToDelete.email);

                setUsers(prev => prev.filter(u => u.id !== id));
                alert("Usuário excluído com sucesso.");
            } catch (error: any) {
                console.error("Error deleting user:", error);
                alert(`Erro ao excluir usuário: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleGenerateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await AuthService.generateInvite(inviteEmail, inviteRole);
            if (result.success && result.token) {
                const baseUrl = window.location.origin + window.location.pathname;
                const link = `${baseUrl}?token=${result.token}&type=activation`;
                setGeneratedLink(link);
                loadPendingInvites();
            }
        } catch (error: any) {
            alert(`Erro ao gerar convite: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeInvite = async (email: string) => {
        if (window.confirm(`Deseja revogar o convite para ${email}?`)) {
            try {
                setLoading(true);
                await AuthService.revokeInvite(email);
                await DatabaseService.deleteFromAllowlist(email);
                loadPendingInvites();
            } catch (error) {
                console.error("Error revoking invite:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData(user);
        setShowModal(true);
    };

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN:
                return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Admin' };
            case UserRole.SALES:
                return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Vendedor' };
            default:
                return { bg: 'bg-white/10', text: 'text-white/60', label: role };
        }
    };

    return (
        <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 p-8 md:p-10 rounded-[2.5rem] border border-neutral-700 shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Gerenciamento de Usuários
                            </h1>
                        </div>
                        <p className="text-neutral-400 text-sm font-medium ml-12">
                            Gestão de acessos, convites e perfis administrativos.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => {
                                setGeneratedLink('');
                                setInviteEmail('');
                                setShowInviteModal(true);
                            }}
                            className="flex-1 md:flex-none bg-white text-neutral-900 px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-neutral-200 transition-all shadow-lg active:scale-95"
                        >
                            <span>Convidar Usuário</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Users List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest flex items-center">
                            Usuários Ativos ({users.length})
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.map(user => {
                            const badge = getRoleBadge(user.role);
                            return (
                                <div
                                    key={user.id}
                                    className="group bg-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-3xl p-5 hover:border-white/20 transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-2xl ${badge.bg} ${badge.text} flex items-center justify-center font-black text-xl shadow-inner`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-700 rounded-xl transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            {user.id !== currentUser.id && (
                                                <button
                                                    onClick={() => handleDelete(user.id, user.name)}
                                                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-bold text-white mb-1">{user.name}</h4>
                                        <p className="text-sm text-neutral-500 font-medium flex items-center mb-4">
                                            {user.email}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                                {badge.label}
                                            </span>
                                            {user.id === currentUser.id && (
                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                    Sessão Atual
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pending Invites Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest flex items-center">
                        Convites Pendentes ({pendingInvites.length})
                    </h3>

                    <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-[2rem] overflow-hidden">
                        <div className="divide-y divide-neutral-800">
                            {pendingInvites.map((invite, idx) => (
                                <div key={idx} className="p-5 hover:bg-neutral-800/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-white font-bold text-sm truncate max-w-[150px]">{invite.email}</p>
                                        <button
                                            onClick={() => handleRevokeInvite(invite.email)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-700 rounded-lg transition-all"
                                            title="Revogar Convite"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-neutral-500 font-bold uppercase">Expira em:</span>
                                        <span className="text-amber-500 font-bold">
                                            {new Date(invite.expires_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const baseUrl = window.location.origin + window.location.pathname;
                                            const link = `${baseUrl}?token=${invite.token}&type=activation`;
                                            navigator.clipboard.writeText(link);
                                            alert("Link copiado para a área de transferência!");
                                        }}
                                        className="w-full mt-4 flex items-center justify-center space-x-2 py-2 bg-neutral-900/50 border border-neutral-700/50 rounded-xl text-[10px] font-black text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                                    >
                                        <Copy size={12} />
                                        <span>COPIAR LINK</span>
                                    </button>
                                </div>
                            ))}
                            {pendingInvites.length === 0 && (
                                <div className="p-8 text-center">
                                    <p className="text-neutral-500 text-xs font-bold italic">Nenhum convite pendente.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-gradient-to-r from-neutral-800/50 to-transparent">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Novo Convite</h3>
                                <p className="text-neutral-400 text-sm font-medium">Gere um link de acesso exclusivo.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="bg-neutral-800 p-2 rounded-2xl text-neutral-500 hover:text-white transition-colors"
                            >
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>

                        {!generatedLink ? (
                            <form onSubmit={handleGenerateInvite} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">E-mail do novo usuário</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                        <input
                                            type="email"
                                            required
                                            placeholder="exemplo@email.com"
                                            value={inviteEmail}
                                            className="w-full pl-12 pr-4 py-4 bg-black/30 border border-neutral-800 rounded-2xl text-white outline-none focus:border-white transition-all text-sm font-bold"
                                            onChange={e => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: UserRole.SALES, label: 'Vendedor', icon: Send },
                                            { id: UserRole.ADMIN, label: 'Admin', icon: Shield }
                                        ].map(role => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setInviteRole(role.id)}
                                                className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${inviteRole === role.id ? 'bg-white text-neutral-900 border-white' : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}
                                            >
                                                <role.icon size={18} />
                                                <span>{role.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'Gerar Link de Convite'}
                                </button>

                                <p className="text-center text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                                    O link expirará em 48 horas após a geração.
                                </p>
                            </form>
                        ) : (
                            <div className="p-8 space-y-6 text-center animate-in slide-in-from-bottom-4">
                                <div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                    <CheckCircle2 className="text-emerald-500" size={40} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-2">Convite Criado!</h4>
                                    <p className="text-neutral-400 text-sm">Copie o link abaixo e envie para o convidado.</p>
                                </div>

                                <div className="bg-black/40 p-4 rounded-2xl border border-neutral-800 break-all text-xs font-mono text-neutral-400 select-all">
                                    {generatedLink}
                                </div>

                                <button
                                    onClick={copyToClipboard}
                                    className={`w-full flex items-center justify-center space-x-2 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${copied ? 'bg-emerald-600 text-white' : 'bg-white text-neutral-900 hover:bg-neutral-200'}`}
                                >
                                    {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                                    <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
                                </button>

                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="text-neutral-500 hover:text-neutral-300 text-[10px] font-black uppercase tracking-widest"
                                >
                                    Fechar e Voltar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                            <h3 className="text-xl font-black text-white">
                                {editingUser ? 'Editar Perfil' : 'Novo Perfil'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingUser(null);
                                    setFormData({ role: UserRole.SALES });
                                }}
                                className="text-neutral-500 hover:text-white transition-colors"
                            >
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome do usuário"
                                    value={formData.name || ''}
                                    className="w-full px-4 py-4 bg-black/30 border border-neutral-800 rounded-2xl text-white outline-none focus:border-white transition-all text-sm font-bold"
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">E-mail</label>
                                <input
                                    type="email"
                                    required
                                    disabled={!!editingUser}
                                    placeholder="email@exemplo.com"
                                    value={formData.email || ''}
                                    className="w-full px-4 py-4 bg-black/30 border border-neutral-800 rounded-2xl text-white outline-none focus:border-white transition-all text-sm font-bold disabled:opacity-50"
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Perfil</label>
                                <select
                                    value={formData.role || UserRole.SALES}
                                    className="w-full px-4 py-4 bg-black/30 border border-neutral-800 rounded-2xl text-white outline-none focus:border-white transition-all text-sm font-bold appearance-none bg-no-repeat bg-[right_1rem_center]"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.2em' }}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value={UserRole.SALES} className="bg-neutral-900">Vendedor</option>
                                    <option value={UserRole.ADMIN} className="bg-neutral-900">Administrador</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-neutral-900 px-4 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'Salvar Alterações'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
