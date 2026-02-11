import React, { useState, useEffect } from 'react';
import { Clock, MessageCircle, CheckCircle2, Copy, X } from 'lucide-react';
import { DatabaseService } from '../lib/supabase';
import { toast } from 'sonner';

interface PublicVoucherLandingProps {
    academyName: string;
    codes: string[];
    createdAt: number;
}

export const PublicVoucherLanding: React.FC<PublicVoucherLandingProps> = ({ academyName, codes, createdAt }) => {
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Background Auras */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-xl w-full relative z-10">
                {/* Decorative border/glow */}
                <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[3rem] pointer-events-none"></div>

                <div className="bg-neutral-900/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center">
                    {/* Header Section */}
                    <div className="pt-14 pb-10 flex flex-col items-center space-y-6 px-8 text-center w-full relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>

                        <div className="w-64 h-auto flex items-center justify-center filter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <img
                                src="/pbjjf_logo_white.png"
                                alt="PBJJF"
                                className="w-3/4 h-auto object-contain"
                            />
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase flex items-center justify-center">
                                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Vip Voucher</span>
                            </h1>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mt-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 inline-block">
                                {academyName}
                            </p>
                        </div>
                    </div>

                    <div className="w-4/5 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                    <div className="p-8 md:p-12 w-full space-y-12">
                        <div className="space-y-10 text-center">
                            <p className="text-sm font-medium text-white/50 leading-relaxed px-6 italic">
                                "Congratulations! You've been invited to join the upcoming PBJJF experience."
                            </p>

                            {/* Voucher Presentation - Ticket Style */}
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-emerald-500/5 blur-2xl rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative bg-black/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 overflow-hidden">
                                    {/* Left Notch */}
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#050505] rounded-full border border-white/5"></div>
                                    {/* Right Notch */}
                                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#050505] rounded-full border border-white/5"></div>

                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Access Codes</p>

                                    <div className="grid grid-cols-1 gap-4">
                                        {codes.filter(c => c.trim().length > 0).map((c, i) => (
                                            <div key={i} className="relative group/code">
                                                <div className="bg-neutral-800/50 border border-white/10 text-white px-8 py-5 rounded-2xl font-mono font-black text-2xl md:text-3xl tracking-widest shadow-2xl transition-all group-hover/code:scale-[1.02] group-hover/code:border-emerald-500/30 uppercase cursor-pointer" onClick={() => {
                                                    navigator.clipboard.writeText(c.trim());
                                                    toast.success("Code copied!");
                                                }}>
                                                    {c.trim()}
                                                    <Copy size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 group-hover/code:text-emerald-500 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className="text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center space-x-2 mx-auto pt-4"
                                    >
                                        <Copy size={12} />
                                        <span>{copied ? 'Copied to Clipboard!' : 'Copy Invitation Link'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-6 pt-4">
                            <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                Instant Redemption
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleWhatsApp}
                                    className="relative group h-20 bg-emerald-600 rounded-[2rem] font-black flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <MessageCircle size={28} fill="currentColor" className="text-white/20" />
                                    <span className="text-xl text-white tracking-tight italic">WhatsApp</span>
                                </button>

                                <button
                                    onClick={handleSMS}
                                    className="relative group h-20 bg-sky-600 rounded-[2rem] font-black flex items-center justify-center gap-3 overflow-hidden transition-all active:scale-95 hover:shadow-[0_20px_40px_-10px_rgba(14,165,233,0.3)]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <MessageCircle size={28} className="text-white/20" />
                                    <span className="text-xl text-white tracking-tight italic">Send SMS</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Keep required elements */}
                    <div className="w-full bg-black/40 p-10 border-t border-white/5 space-y-8">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="flex justify-center items-center space-x-3 text-[9px] text-white/30 font-black uppercase tracking-[0.3em]">
                                <Clock size={12} className="text-emerald-500" />
                                <span>Expires in 24 hours</span>
                            </div>
                            <div className="text-[8px] text-white/10 font-bold uppercase tracking-[0.1em]">
                                Secure BJJVisits Token
                            </div>
                        </div>

                        <button
                            onClick={() => setIsClosed(true)}
                            className="w-full flex items-center justify-center space-x-2 text-white/20 hover:text-red-400/60 transition-all text-[9px] font-black uppercase tracking-[0.4em] pt-4"
                        >
                            <X size={14} />
                            <span>Close Screen</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
