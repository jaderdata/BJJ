import React, { useState, useMemo, useEffect } from 'react';
import {
    Download,
    Printer,
    Search,
    Ticket,
    FileBarChart,
    TrendingUp,
    Calendar,
    Users as UsersIcon,
    CheckCircle2,
    AlertCircle,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Eraser
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
    Legend
} from 'recharts';
import {
    User,
    Academy,
    Event,
    Visit,
    Voucher,
    FinanceRecord,
    AcademyTemperature
} from '../types';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
    events: Event[];
    academies: Academy[];
    visits: Visit[];
    vouchers: Voucher[];
    vendedores: User[];
    finance: FinanceRecord[];
}

export const Reports: React.FC<ReportsProps> = ({
    events,
    academies,
    visits,
    vouchers,
    vendedores,
    finance = []
}) => {
    // Filter states
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [eventFilter, setEventFilter] = useState('');
    const [salesFilter, setSalesFilter] = useState('');

    // Sorting states
    const [sortBy, setSortBy] = useState<'code' | 'date' | 'academy' | 'event' | 'seller'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Grouping state
    const [groupBy, setGroupBy] = useState<'none' | 'seller' | 'event'>('none');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Get unique years
    const years = useMemo(() => {
        const yearsSet = new Set<number>();
        vouchers.forEach(v => {
            if (v.createdAt) yearsSet.add(new Date(v.createdAt).getFullYear());
        });
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [vouchers]);

    // Count active filters
    const activeFiltersCount = [searchTerm, yearFilter, eventFilter, salesFilter].filter(Boolean).length;

    // Clear all filters
    const clearAllFilters = () => {
        setSearchInput('');
        setSearchTerm('');
        setYearFilter('');
        setEventFilter('');
        setSalesFilter('');
    };

    // Advanced Data Filtering & Transformation
    const filteredVisits = useMemo(() => {
        return visits.filter(v => {
            const matchesYear = !yearFilter || (v.finishedAt && new Date(v.finishedAt).getFullYear().toString() === yearFilter);
            const matchesEvent = !eventFilter || v.eventId === eventFilter;
            const matchesSales = !salesFilter || v.salespersonId === salesFilter;
            return matchesYear && matchesEvent && matchesSales;
        });
    }, [visits, yearFilter, eventFilter, salesFilter]);

    const filteredVouchers = useMemo(() => {
        return vouchers.filter(v => {
            const visit = visits.find(vis => vis.id === v.visitId);
            const academy = academies.find(a => a.id === v.academyId);
            const event = events.find(e => e.id === v.eventId);

            const matchesSearch = !searchTerm ||
                v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (academy?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesYear = !yearFilter || new Date(v.createdAt).getFullYear().toString() === yearFilter;
            const matchesEvent = !eventFilter || v.eventId === eventFilter;
            const matchesSales = !salesFilter || (visit?.salespersonId === salesFilter || event?.salespersonId === salesFilter);

            return matchesSearch && matchesYear && matchesEvent && matchesSales;
        });
    }, [vouchers, searchTerm, yearFilter, eventFilter, salesFilter, visits, academies, events]);

    const filteredFinance = useMemo(() => {
        return finance.filter(f => {
            const matchesEvent = !eventFilter || f.eventId === eventFilter;
            const matchesSales = !salesFilter || f.salespersonId === salesFilter;
            return matchesEvent && matchesSales;
        });
    }, [finance, eventFilter, salesFilter]);

    // 1. Funnel Data (Attribution -> Visit -> Voucher)
    const funnelData = useMemo(() => {
        // Find academies assigned to events in filter
        const relevantEvents = eventFilter ? events.filter(e => e.id === eventFilter) : events;
        const totalAssignedAcademies = relevantEvents.reduce((acc, e) => acc + e.academiesIds.length, 0);

        const totalVisits = filteredVisits.length;
        const totalVouchers = filteredVouchers.length;

        return [
            { name: 'Possíveis Atribuições', value: totalAssignedAcademies, color: '#6366f1' },
            { name: 'Visitas Realizadas', value: totalVisits, color: '#8b5cf6' },
            { name: 'Vouchers Gerados', value: totalVouchers, color: '#ec4899' }
        ];
    }, [events, eventFilter, filteredVisits, filteredVouchers]);

    // 2. Timeline Data (Evolution)
    const timelineData = useMemo(() => {
        const days: Record<string, { date: string, visits: number, vouchers: number }> = {};

        // Group by last 30 days or by month if year is selected
        filteredVisits.forEach(v => {
            if (v.finishedAt) {
                const d = new Date(v.finishedAt).toLocaleDateString('pt-BR');
                if (!days[d]) days[d] = { date: d, visits: 0, vouchers: 0 };
                days[d].visits++;
            }
        });

        filteredVouchers.forEach(v => {
            const d = new Date(v.createdAt).toLocaleDateString('pt-BR');
            if (!days[d]) days[d] = { date: d, visits: 0, vouchers: 0 };
            days[d].vouchers++;
        });

        return Object.values(days).sort((a, b) => {
            const [da, ma, ya] = a.date.split('/').map(Number);
            const [db, mb, yb] = b.date.split('/').map(Number);
            return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
        }).slice(-15); // Show last 15 active days
    }, [filteredVisits, filteredVouchers]);

    // 3. Temperature Data (Sentimento)
    const temperatureData = useMemo(() => {
        const counts = {
            [AcademyTemperature.COLD]: 0,
            [AcademyTemperature.WARM]: 0,
            [AcademyTemperature.HOT]: 0
        };

        filteredVisits.forEach(v => {
            if (v.temperature) {
                counts[v.temperature]++;
            }
        });

        return [
            { name: 'Frio (Cold)', value: counts[AcademyTemperature.COLD], color: '#3b82f6' },
            { name: 'Morno (Warm)', value: counts[AcademyTemperature.WARM], color: '#eab308' },
            { name: 'Quente (Hot)', value: counts[AcademyTemperature.HOT], color: '#ef4444' }
        ];
    }, [filteredVisits]);

    // 4. Financial Analytics
    const financialAnalytic = useMemo(() => {
        const totalReceived = filteredFinance
            .filter(f => f.status === 'Recebido')
            .reduce((acc, f) => acc + f.amount, 0);

        const totalPaid = filteredFinance
            .filter(f => f.status === 'Pago')
            .reduce((acc, f) => acc + f.amount, 0);

        const netBalance = totalReceived - totalPaid;

        return {
            received: totalReceived,
            paid: totalPaid,
            balance: netBalance
        };
    }, [filteredFinance]);

    // 5. Efficiency Metrics
    const efficiencyMetrics = useMemo(() => {
        const visitsWithDuration = filteredVisits.filter(v => v.startedAt && v.finishedAt);
        if (visitsWithDuration.length === 0) return { avgDuration: 0, conversionRate: 0 };

        const totalDuration = visitsWithDuration.reduce((acc, v) => {
            const start = new Date(v.startedAt!).getTime();
            const end = new Date(v.finishedAt!).getTime();
            return acc + (end - start);
        }, 0);

        const avgDurationMs = totalDuration / visitsWithDuration.length;
        const avgMinutes = Math.round(avgDurationMs / (1000 * 60));

        const conversionRate = filteredVisits.length > 0
            ? Math.round((filteredVouchers.length / filteredVisits.length) * 100)
            : 0;

        return {
            avgDuration: avgMinutes,
            conversionRate
        };
    }, [filteredVisits, filteredVouchers]);

    // Sorting vouchers
    const sortedVouchers = useMemo(() => {
        const sorted = [...filteredVouchers].sort((a, b) => {
            let compareA: any;
            let compareB: any;

            switch (sortBy) {
                case 'code':
                    compareA = a.code;
                    compareB = b.code;
                    break;
                case 'date':
                    compareA = new Date(a.createdAt).getTime();
                    compareB = new Date(b.createdAt).getTime();
                    break;
                case 'academy':
                    compareA = academies.find(ac => ac.id === a.academyId)?.name || '';
                    compareB = academies.find(ac => ac.id === b.academyId)?.name || '';
                    break;
                case 'event':
                    compareA = events.find(e => e.id === a.eventId)?.name || '';
                    compareB = events.find(e => e.id === b.eventId)?.name || '';
                    break;
                case 'seller':
                    const visitA = visits.find(v => v.id === a.visitId);
                    const visitB = visits.find(v => v.id === b.visitId);
                    const eventA = events.find(e => e.id === a.eventId);
                    const eventB = events.find(e => e.id === b.eventId);
                    compareA = vendedores.find(u => u.id === (visitA?.salespersonId || eventA?.salespersonId))?.name || '';
                    compareB = vendedores.find(u => u.id === (visitB?.salespersonId || eventB?.salespersonId))?.name || '';
                    break;
            }

            if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [filteredVouchers, sortBy, sortOrder, academies, events, visits, vendedores]);

    // Basic KPIs Summary
    const uniqueAcademies = new Set(filteredVouchers.map(v => v.academyId)).size;
    const uniqueEvents = new Set(filteredVouchers.map(v => v.eventId)).size;
    const uniqueSellers = new Set(filteredVouchers.map(v => {
        const visit = visits.find(vis => vis.id === v.visitId);
        const event = events.find(e => e.id === v.eventId);
        return visit?.salespersonId || event?.salespersonId;
    })).size;

    // Export PDF function
    const exportPDF = () => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(124, 58, 237); // Purple color
            doc.text('Relatório de Vouchers', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('BJJ Visits - Sistema de Gerenciamento', 14, 27);

            // Filters info
            let yPos = 35;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text('Filtros Aplicados:', 14, yPos);

            yPos += 7;
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);

            if (searchTerm) {
                doc.text(`• Busca: ${searchTerm}`, 14, yPos);
                yPos += 5;
            }
            if (yearFilter) {
                doc.text(`• Ano: ${yearFilter}`, 14, yPos);
                yPos += 5;
            }
            if (eventFilter) {
                const eventName = events.find(e => e.id === eventFilter)?.name || 'N/A';
                doc.text(`• Evento: ${eventName}`, 14, yPos);
                yPos += 5;
            }
            if (salesFilter) {
                const sellerName = vendedores.find(v => v.id === salesFilter)?.name || 'N/A';
                doc.text(`• Vendedor: ${sellerName}`, 14, yPos);
                yPos += 5;
            }

            if (!searchTerm && !yearFilter && !eventFilter && !salesFilter) {
                doc.text('• Nenhum filtro aplicado (todos os registros)', 14, yPos);
                yPos += 5;
            }

            yPos += 5;

            // KPIs Summary - Advanced BI Row 1
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text('Performance Analytics:', 14, yPos);
            yPos += 6;

            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Conversão: ${efficiencyMetrics.conversionRate}%`, 14, yPos);
            doc.text(`Lead Time Médio: ${efficiencyMetrics.avgDuration} min`, 60, yPos);
            doc.text(`Receita Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialAnalytic.received)}`, 110, yPos);
            doc.text(`Saldo Líquido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialAnalytic.balance)}`, 160, yPos);

            yPos += 8;

            // KPIs Summary - Operational Row
            doc.text(`Total de Vouchers: ${filteredVouchers.length}`, 14, yPos);
            doc.text(`Academias: ${uniqueAcademies}`, 60, yPos);
            doc.text(`Eventos: ${uniqueEvents}`, 110, yPos);
            doc.text(`Vendedores: ${uniqueSellers}`, 160, yPos);

            yPos += 10;

            // Table data
            const tableData = sortedVouchers.map(v => {
                const visit = visits.find(vis => vis.id === v.visitId);
                const academy = academies.find(a => a.id === v.academyId);
                const event = events.find(e => e.id === v.eventId);
                const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId));

                return [
                    v.code,
                    new Date(v.createdAt).toLocaleDateString('pt-BR'),
                    academy?.name || '---',
                    `${academy?.city || ''} - ${academy?.state || ''}`,
                    event?.name || '---',
                    seller?.name || 'Sistêmico'
                ];
            });

            // Generate table
            autoTable(doc, {
                startY: yPos,
                head: [['Código', 'Data', 'Academia', 'Localização', 'Evento', 'Vendedor']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [124, 58, 237], // Purple
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: 50
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 250]
                },
                columnStyles: {
                    0: { cellWidth: 25, fontStyle: 'bold' }, // Código
                    1: { cellWidth: 22 }, // Data
                    2: { cellWidth: 45 }, // Academia
                    3: { cellWidth: 35 }, // Localização
                    4: { cellWidth: 35 }, // Evento
                    5: { cellWidth: 30 } // Vendedor
                },
                margin: { left: 14, right: 14 },
                didDrawPage: function (data) {
                    // Footer
                    const pageCount = doc.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);

                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        const pageHeight = doc.internal.pageSize.height;
                        doc.text(
                            `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
                            14,
                            pageHeight - 10
                        );
                        doc.text(
                            `Página ${i} de ${pageCount}`,
                            doc.internal.pageSize.width - 40,
                            pageHeight - 10
                        );
                    }
                }
            });

            // Save PDF
            const fileName = `relatorio-vouchers-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            // Show success toast
            setToast({ message: 'PDF gerado com sucesso!', type: 'success' });
        } catch (error) {
            console.error('Error generating PDF:', error);
            setToast({ message: 'Erro ao gerar PDF', type: 'error' });
        }
    };

    // Export CSV function
    const exportCSV = () => {
        try {
            const headers = ['Código', 'Data', 'Academia', 'Evento', 'Vendedor'];
            const rows = sortedVouchers.map(v => {
                const visit = visits.find(vis => vis.id === v.visitId);
                const academy = academies.find(a => a.id === v.academyId);
                const event = events.find(e => e.id === v.eventId);
                const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId));

                return [
                    v.code,
                    new Date(v.createdAt).toLocaleDateString('pt-BR'),
                    academy?.name || '---',
                    event?.name || '---',
                    seller?.name || 'Sistêmico'
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio-vouchers-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            // Show success toast
            setToast({ message: 'CSV gerado com sucesso!', type: 'success' });
        } catch (error) {
            console.error('Error generating CSV:', error);
            setToast({ message: 'Erro ao gerar CSV', type: 'error' });
        }
    };

    return (
        <div className="space-y-6 p-4">
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-20 right-8 z-[200] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right flex items-center space-x-3">
                    {toast.type === 'success' ? (
                        <div className="p-2 bg-emerald-500/20 rounded-xl">
                            <CheckCircle2 size={20} className="text-emerald-400" strokeWidth={2} />
                        </div>
                    ) : (
                        <div className="p-2 bg-red-500/20 rounded-xl">
                            <AlertCircle size={20} className="text-red-400" strokeWidth={2} />
                        </div>
                    )}
                    <span className="font-bold text-sm">{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={16} strokeWidth={2} />
                    </button>
                </div>
            )}

            {/* Header with Gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(262,83%,58%)] via-[hsl(262,83%,48%)] to-[hsl(262,83%,38%)] p-6 rounded-2xl shadow-2xl print:hidden">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                Relatórios e KPIs
                            </h1>
                            {activeFiltersCount > 0 && (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-black text-white">
                                    {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}
                                </span>
                            )}
                        </div>
                        <p className="text-white/80 text-sm font-medium">
                            Análise de vouchers gerados e performance
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={exportCSV}
                            className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20 transition-all"
                        >
                            <Download size={16} strokeWidth={2} />
                            <span className="hidden sm:inline">CSV</span>
                        </button>
                        <button
                            onClick={exportPDF}
                            className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-2 hover:bg-white/20 transition-all"
                        >
                            <Printer size={16} strokeWidth={2} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Command Center - Premium KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 print:hidden">
                {[
                    {
                        label: 'Total Vouchers',
                        value: filteredVouchers.length,
                        subValue: `${filteredVisits.length} visitas`,
                        iconBg: 'bg-purple-500/20',
                        iconColor: 'text-purple-400'
                    },
                    {
                        label: 'Lead Time Médio',
                        value: `${efficiencyMetrics.avgDuration} min`,
                        subValue: 'Duração Visita',
                        bgGlow: 'bg-rose-500/20',
                        iconBg: 'bg-rose-500/20',
                        iconColor: 'text-rose-400'
                    }
                ].map((kpi, i) => (
                    <div
                        key={i}
                        className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                    >
                        <div className={`absolute -top-24 -right-24 w-48 h-48 ${kpi.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                        <div className="relative z-10">


                            <div>
                                <h3 className="text-xl font-black text-white mb-0.5 tracking-tight group-hover:text-purple-300 transition-colors">
                                    {kpi.value}
                                </h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 font-mono">
                                    {kpi.label}
                                </p>
                                <div className="text-[10px] font-medium text-white/30 truncate">
                                    {kpi.subValue}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 - Timeline Evolution */}
            <div className="grid grid-cols-1 gap-6 print:hidden">
                {/* Timeline Area Chart */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Evolução Temporal</h3>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorVouchers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.3)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                                <Area
                                    name="Visitas"
                                    type="monotone"
                                    dataKey="visits"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVisits)"
                                />
                                <Area
                                    name="Vouchers"
                                    type="monotone"
                                    dataKey="vouchers"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorVouchers)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 - Sentiment Analysis */}
            <div className="grid grid-cols-1 gap-6 print:hidden">
                {/* Sentiment Pie Chart */}
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Sentimento de Mercado</h3>
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={temperatureData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {temperatureData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2">
                        {temperatureData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-white/60">{item.name}</span>
                                </div>
                                <span className="text-white font-black">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters & Grouping */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 print:hidden">
                <div className="md:col-span-4 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar código ou academia..."
                        className="w-full pl-10 pr-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <div className="md:col-span-8 flex flex-wrap gap-4">
                    <select
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-white/30 text-sm font-bold flex-1"
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value as any)}
                    >
                        <option value="none" className="bg-[hsl(222,47%,15%)]">Sem Agrupamento</option>
                        <option value="seller" className="bg-[hsl(222,47%,15%)]">Agrupar por Vendedor</option>
                        <option value="event" className="bg-[hsl(222,47%,15%)]">Agrupar por Evento</option>
                    </select>

                    <select
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-white/30 text-sm font-bold flex-1"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                    >
                        <option value="" className="bg-[hsl(222,47%,15%)]">Todos os Anos</option>
                        {years.map(y => <option key={y} value={y.toString()} className="bg-[hsl(222,47%,15%)]">{y}</option>)}
                    </select>

                    <select
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white px-4 py-2 outline-none focus:ring-2 focus:ring-white/30 text-sm font-bold flex-1"
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                    >
                        <option value="" className="bg-[hsl(222,47%,15%)]">Todos os Eventos</option>
                        {events.map(e => <option key={e.id} value={e.id} className="bg-[hsl(222,47%,15%)]">{e.name}</option>)}
                    </select>

                    <button
                        onClick={clearAllFilters}
                        disabled={activeFiltersCount === 0}
                        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white px-4 py-2 font-bold flex items-center justify-center space-x-2 hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                        <Eraser size={16} strokeWidth={2} />
                        <span className="hidden lg:inline">Limpar</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-black text-white">
                            Explorador de Dados ({sortedVouchers.length})
                        </h3>
                    </div>
                    {groupBy !== 'none' && (
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            Modo de Agrupamento Ativo
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th
                                    className="px-4 py-3 text-xs font-black text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none"
                                    onClick={() => {
                                        if (sortBy === 'code') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('code');
                                            setSortOrder('asc');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Código</span>
                                        {sortBy === 'code' ? (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} className="opacity-40" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-black text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none"
                                    onClick={() => {
                                        if (sortBy === 'date') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('date');
                                            setSortOrder('desc');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Data</span>
                                        {sortBy === 'date' ? (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} className="opacity-40" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-black text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none"
                                    onClick={() => {
                                        if (sortBy === 'academy') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('academy');
                                            setSortOrder('asc');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Academia</span>
                                        {sortBy === 'academy' ? (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} className="opacity-40" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-black text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none"
                                    onClick={() => {
                                        if (sortBy === 'event') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('event');
                                            setSortOrder('asc');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Evento</span>
                                        {sortBy === 'event' ? (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} className="opacity-40" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-xs font-black text-white/60 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none"
                                    onClick={() => {
                                        if (sortBy === 'seller') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('seller');
                                            setSortOrder('asc');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Vendedor</span>
                                        {sortBy === 'seller' ? (
                                            sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        ) : (
                                            <ArrowUpDown size={14} className="opacity-40" />
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedVouchers.length > 0 ? (
                                groupBy === 'none' ? (
                                    sortedVouchers.map(v => {
                                        const visit = visits.find(vis => vis.id === v.visitId);
                                        const academy = academies.find(a => a.id === v.academyId);
                                        const event = events.find(e => e.id === v.eventId);
                                        const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId));

                                        return (
                                            <tr key={v.code} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono font-black text-sm text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 group-hover:border-purple-500/40 transition-all">
                                                        {v.code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-white/60 font-medium">
                                                    {new Date(v.createdAt).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-white text-sm">{academy?.name || '---'}</div>
                                                    <div className="text-xs text-white/40">{academy?.city}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-white/80 font-medium">
                                                    {event?.name || '---'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                                                            {seller?.name.charAt(0) || 'S'}
                                                        </div>
                                                        <span className="font-semibold text-sm text-white/80">{seller?.name || 'Sistêmico'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    // Grouped View
                                    Object.entries(
                                        sortedVouchers.reduce((acc, v) => {
                                            let key = 'N/A';
                                            if (groupBy === 'seller') {
                                                const visit = visits.find(vis => vis.id === v.visitId);
                                                const event = events.find(e => e.id === v.eventId);
                                                key = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId))?.name || 'Sistêmico';
                                            } else if (groupBy === 'event') {
                                                key = events.find(e => e.id === v.eventId)?.name || 'Eventos Antigos';
                                            }
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(v);
                                            return acc;
                                        }, {} as Record<string, Voucher[]>)
                                    ).map(([groupName, groupVouchers]) => {
                                        const vouchersInGroup = groupVouchers as Voucher[];
                                        return (
                                            <React.Fragment key={groupName}>
                                                <tr className="bg-white/5 border-l-4 border-purple-500">
                                                    <td colSpan={5} className="px-4 py-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black text-white uppercase tracking-widest">{groupName}</span>
                                                            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                                                {vouchersInGroup.length} vouchers
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {vouchersInGroup.map(v => {
                                                    const visit = visits.find(vis => vis.id === v.visitId);
                                                    const academy = academies.find(a => a.id === v.academyId);
                                                    const event = events.find(e => e.id === v.eventId);
                                                    const seller = vendedores.find(u => u.id === (visit?.salespersonId || event?.salespersonId));
                                                    return (
                                                        <tr key={v.code} className="hover:bg-white/5 transition-colors group">
                                                            <td className="px-4 py-3">
                                                                <span className="font-mono font-black text-xs text-white/40 group-hover:text-purple-400 transition-all pl-4">
                                                                    {v.code}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-white/40 font-medium">
                                                                {new Date(v.createdAt).toLocaleDateString('pt-BR')}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="font-bold text-white/80 text-sm">{academy?.name || '---'}</div>
                                                                <div className="text-[10px] text-white/20">{academy?.city}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-white/60 font-medium">
                                                                {event?.name || '---'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="font-semibold text-xs text-white/60">{seller?.name || 'Sistêmico'}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })
                                )
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-20 text-center text-white/40 italic">
                                        Nenhum voucher encontrado com os filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
