import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, Copy, X } from 'lucide-react';
import { DatabaseService } from '../lib/supabase';
import { formatPhone, getCleanPhone } from '../lib/business-utils';

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
    const [phoneCountry, setPhoneCountry] = useState<'BR' | 'US' | 'PT'>('US');
    const [loadingPhone, setLoadingPhone] = useState(true);

    // COUNTRY_CODES moved to business-utils

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const [phone, country] = await Promise.all([
                    DatabaseService.getSetting('voucher_redemption_phone'),
                    DatabaseService.getSetting('voucher_phone_country'),
                ]);
                if (phone) {
                    const clean = String(phone).replace(/"/g, '').replace(/\D/g, '');
                    if (clean && clean.length >= 9) setRedemptionPhone(clean);
                }
                if (country) {
                    const c = String(country).replace(/"/g, '') as 'BR' | 'US' | 'PT';
                    if (['BR', 'US', 'PT'].includes(c)) setPhoneCountry(c);
                }
            } catch (err) {
                console.log('Using default redemption phone (public access)');
            } finally {
                setLoadingPhone(false);
            }
        };
        fetchSettings();
    }, []);

    const getMessageBody = () => {
        return `PBJJF Voucher Redemption\n\nAcademy: ${academyName}\nVouchers: ${codes.join(', ')}\n\nPlease confirm receipt and processing.`;
    };

    const getClean = (phone: string) => getCleanPhone(phone, phoneCountry);

    const handleWhatsApp = () => {
        const text = encodeURIComponent(getMessageBody());
        const clean = getClean(redemptionPhone);
        window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
    };

    const handleSMS = () => {
        const body = encodeURIComponent(getMessageBody());
        const clean = getClean(redemptionPhone);
        window.location.href = `sms:${clean}?body=${body}`;
    };

    // formatPhone imported from business-utils

    const contentToCopy = `Academy: ${academyName}\nVouchers: ${codes.join(', ')}\n\nRedeem at: ${formatPhone(redemptionPhone, phoneCountry)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isClosed) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="bg-neutral-800 border border-neutral-700 max-w-md w-full p-10 rounded-[2rem] space-y-4 shadow-2xl">
                    <div className="text-amber-500 font-black text-4xl mb-4 animate-bounce">OSS!</div>
                    <h1 className="text-2xl font-black text-white">Vouchers Saved!</h1>
                    <p className="text-neutral-400">You can now close this screen.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center">
                {/* Header */}
                <div className="pt-12 pb-8 flex flex-col items-center space-y-4 px-6 text-center w-full">
                    <div className="w-56 h-auto flex items-center justify-center mb-2">
                        <img
                            src="/pbjjf_logo_2026.png"
                            alt="PBJJF"
                            className="w-2/3 h-auto object-contain mix-blend-screen"
                        />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">PBJJF Vouchers</h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] leading-relaxed max-w-xs">{academyName}</p>
                </div>

                <div className="w-full h-px bg-white/5 mx-auto max-w-xs"></div>

                <div className="p-8 md:p-10 w-full space-y-10">
                    <div className="space-y-8 text-center">
                        <h2 className="text-xl font-bold text-white leading-snug px-4">
                            Thank you for being part of the upcoming PBJJF event!
                        </h2>

                        {/* Voucher Box */}
                        <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 space-y-6">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Your Vouchers</p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                {codes.filter(c => c.trim().length > 0).map((c, i) => (
                                    <div key={i} className="bg-black/40 border border-white/10 text-white px-8 py-4 rounded-md font-mono font-black text-xl md:text-2xl shadow-inner uppercase">
                                        {c.trim()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <p className="text-center text-[10px] font-bold text-neutral-500 italic">
                            Click below to redeem your vouchers instantly:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={handleWhatsApp}
                                className="bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={24} fill="currentColor" className="text-white/20" />
                                    <span className="text-lg">WhatsApp</span>
                                </div>
                            </button>
                            <button
                                onClick={handleSMS}
                                className="bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-md font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={24} />
                                    <span className="text-lg">Send SMS</span>
                                </div>
                            </button>
                        </div>
                    </div>


                </div>

                {/* Footer */}
                <div className="w-full bg-black/30 p-8 border-t border-white/5 space-y-6">
                    <div className="flex justify-center items-center space-x-2 text-[8px] md:text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
                        <span>Secure BJJVisits Token</span>
                    </div>

                    <button
                        onClick={() => setIsClosed(true)}
                        className="w-full flex items-center justify-center space-x-2 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <X size={14} />
                        <span>Close Screen</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
