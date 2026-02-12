import React from 'react';
import { User } from '../types';
import { User as UserIcon, Calendar, Briefcase } from 'lucide-react';

interface VendorListProps {
    vendors: User[];
    onSelect: (vendorId: string) => void;
}

export const VendorList: React.FC<VendorListProps> = ({ vendors, onSelect }) => {
    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="relative overflow-hidden bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent backdrop-blur-sm"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight">
                            Vendedores
                        </h1>
                        <p className="text-white/80 text-sm font-medium">
                            Equipe comercial e performance
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.map(vendor => (
                    <div
                        key={vendor.id}
                        onClick={() => onSelect(vendor.id)}
                        className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="relative z-10 flex items-start space-x-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center border border-white/10 shadow-inner">
                                {vendor.photoUrl ? (
                                    <img src={vendor.photoUrl} alt={vendor.name} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    <span className="text-2xl font-black text-white/40">{vendor.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white truncate">{vendor.name}</h3>
                                <p className="text-sm text-neutral-400 truncate mb-2">{vendor.email}</p>

                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg uppercase tracking-wider">
                                        Vendedor
                                    </span>
                                    {vendor.phone && (
                                        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-800 px-2 py-1 rounded-lg">
                                            {vendor.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
