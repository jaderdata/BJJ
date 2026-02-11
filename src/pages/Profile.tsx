import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { DatabaseService } from '../lib/supabase';
import { Camera, Mail, Phone, MapPin, User as UserIcon, LogOut, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileProps {
    user: User;
    onUpdate: (user: User) => void;
    onLogout: () => void;
    onBack: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onLogout, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user.name || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [city, setCity] = useState(user.city || '');
    const [uf, setUf] = useState(user.uf || '');
    const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);

        // US Mask: (999) 999-9999
        let masked = value;
        if (value.length > 0) masked = `(${value.slice(0, 3)}`;
        if (value.length > 3) masked += `) ${value.slice(3, 6)}`;
        if (value.length > 6) masked += `-${value.slice(6, 10)}`;

        setPhone(masked);
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const uploadedUrl = await DatabaseService.uploadUserProfilePhoto(file);
            setPhotoUrl(uploadedUrl);
            toast.success('Foto carregada com sucesso!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Erro ao carregar foto.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('O nome é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            const updates = {
                name,
                phone,
                city,
                uf,
                photo_url: photoUrl
            };

            await DatabaseService.updateUser(user.id, updates);

            const updatedUser: User = {
                ...user,
                name,
                phone,
                city,
                uf,
                photoUrl
            };

            onUpdate(updatedUser);
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao salvar alterações.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight">MEU PERFIL</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Gerencie suas informações</p>
                </div>
                <button
                    onClick={onLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                >
                    <LogOut size={14} />
                    <span>Sair</span>
                </button>
            </div>

            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* Avatar Upload Container */}
                    <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                        <div className="w-32 h-32 rounded-[2rem] bg-neutral-900 border-2 border-white/10 overflow-hidden relative shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/10">
                                    <UserIcon size={64} strokeWidth={1} />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>

                        {/* Status Batch */}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-neutral-900 flex items-center justify-center shadow-lg">
                            <Camera className="text-white" size={16} />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />

                    {/* Form Grid */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                        {/* Nome */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-emerald-500 transition-colors">
                                    <UserIcon size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/10 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                        </div>

                        {/* Email - Read Only */}
                        <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">E-mail (Permanente)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20">
                                    <Mail size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white/50 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Telefone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Telefone (EUA)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-emerald-500 transition-colors">
                                    <Phone size={18} strokeWidth={1.5} />
                                </div>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/10 focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                    placeholder="(555) 000-0000"
                                />
                            </div>
                        </div>

                        {/* Cidade & UF Container */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Cidade</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder-white/10 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                                    placeholder="Ex: Orlando"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">UF</label>
                                <input
                                    type="text"
                                    value={uf}
                                    maxLength={2}
                                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder-white/10 focus:outline-none focus:border-emerald-500/5 transition-all text-center text-sm"
                                    placeholder="FL"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex items-center space-x-4 mt-12 pt-8 border-t border-white/5">
                        <button
                            onClick={onBack}
                            className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-[2] px-6 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-900 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95 group"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Salvar Alterações</span>
                                    <div className="w-6 h-6 bg-black/10 rounded-lg flex items-center justify-center group-hover:bg-black/20 transition-colors">
                                        <ImageIcon size={14} className="opacity-60" />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Support Info */}
            <p className="text-center text-[10px] text-white/20 font-medium uppercase tracking-[0.1em]">
                Para alterar seu e-mail, entre em contato com o administrador.
            </p>
        </div>
    );
};
