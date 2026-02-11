import React, { useState, useMemo } from 'react';
import {
  CalendarDays, X, CheckCircle2, Clock, Plus, Minus, AlertCircle, ChevronRight, ChevronLeft,
  Ticket, Info, Bell, Search, Edit3, Camera, Trash2, RefreshCw, QrCode, Copy, ExternalLink,
  History, TrendingUp, MessageCircle, Phone, Save, Loader2, Play, Image as ImageIcon,
  Upload, Mic, Send, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  User,
  UserRole,
  Academy,
  Event,
  EventStatus,
  Visit,
  VisitStatus,
  AcademyTemperature,
  ContactPerson,
  FinanceRecord,
  FinanceStatus,
  Voucher,
} from '../types';
import { DatabaseService } from '../lib/supabase';
import { cn, generateVoucherCode } from '../lib/utils';
import { VisitDetail } from './VisitDetail';
import { ProgressBar } from '../components/ProgressBar';

export const SalespersonEvents: React.FC<{ events: Event[], academies: Academy[], visits: Visit[], notifications: any, onDismissNotif: any, onSelectAcademy: any, currentUserId: string }> = ({ events, academies, visits, notifications, onDismissNotif, onSelectAcademy, currentUserId }) => {
  const nonTestEvents = events.filter(e => !e.name.trim().toUpperCase().endsWith('TESTE'));
  const totalAcademies = nonTestEvents.reduce((acc, e) => acc + (e.academiesIds?.length || 0), 0);
  const completedVisitsCount = nonTestEvents.reduce((acc, e) => {
    const visitedInEvent = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
    const uniqueVisitedIds = new Set(visitedInEvent.map(v => v.academyId));
    const validVisitedCount = Array.from(uniqueVisitedIds).filter(aid => e.academiesIds.includes(aid)).length;
    return acc + validVisitedCount;
  }, 0);

  const activeVisit = visits.find(v => v.salespersonId === currentUserId && v.status === VisitStatus.PENDING);
  const isOverdue = activeVisit && activeVisit.startedAt && (Date.now() - new Date(activeVisit.startedAt).getTime() > 3600000);

  const handleAcademyClick = (eventId: string, academyId: string) => {
    if (activeVisit) {
      if (activeVisit.academyId !== academyId || activeVisit.eventId !== eventId) {
        toast.error("Você já tem uma visita em andamento!", {
          description: "Finalize a visita atual antes de iniciar outra."
        });
        return;
      }
    }
    onSelectAcademy(eventId, academyId);
  };

  return (
    <div className="space-y-10 pb-40 animate-in fade-in slide-in-from-bottom-5 duration-700">

      {/* Dynamic Header Badge for Active Tasks - Premium Glassmorphism */}
      {activeVisit && (
        <div
          onClick={() => handleAcademyClick(activeVisit.eventId, activeVisit.academyId)}
          className={cn(
            "relative overflow-hidden p-6 rounded-[2.5rem] border backdrop-blur-3xl cursor-pointer group transition-all duration-500 hover:-translate-y-1 active:scale-[0.98] shadow-2xl",
            isOverdue
              ? "bg-red-500/10 border-red-500/30 shadow-red-500/20"
              : "bg-emerald-500/15 border-emerald-500/30 shadow-emerald-500/20"
          )}
        >
          {/* Animated decorative glow */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r transition-opacity duration-1000",
            isOverdue ? "from-red-500/10 to-transparent" : "from-emerald-500/10 to-transparent"
          )} />

          <div className="flex items-center space-x-5 relative z-10">
            <div className={cn(
              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110",
              isOverdue ? "bg-red-500 text-white" : "bg-emerald-500 text-white shadow-emerald-500/40"
            )}>
              {isOverdue ? <AlertCircle size={32} className="animate-pulse" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                  isOverdue ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                )}>
                  {isOverdue ? "Crítico" : "Em Andamento"}
                </span>
                {isOverdue && <span className="text-[10px] font-black text-red-500 animate-pulse">? HÁ +1H</span>}
              </div>
              <h4 className="text-xl font-black text-white tracking-tight mt-1 truncate">
                {academies.find(a => a.id === activeVisit.academyId)?.name}
              </h4>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">
                Toque para continuar o atendimento
              </p>
            </div>
            <ChevronRight size={24} className={cn("transition-transform group-hover:translate-x-2", isOverdue ? "text-red-500/40" : "text-emerald-500/40")} />
          </div>
        </div>
      )}

      {/* Premium Hero Stats Section */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden group">
          {/* Decorative background flare */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-1000"></div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">Desempenho</h2>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-emerald-500 italic tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {Math.round((completedVisitsCount / (totalAcademies || 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="bg-black/40 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Progresso de Visitas</span>
                <span className="text-[10px] font-black text-emerald-500/60">{completedVisitsCount} / {totalAcademies}</span>
              </div>
              <ProgressBar percentage={Math.round((completedVisitsCount / (totalAcademies || 1)) * 100)} height="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-colors hover:bg-white/10">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Total Alocado</p>
                <p className="text-2xl font-black text-white mt-1 tracking-tighter italic">{totalAcademies}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-right transition-colors hover:bg-emerald-500/10">
                <p className="text-[9px] font-black text-emerald-500/30 uppercase tracking-widest text-right">Concluídos</p>
                <p className="text-2xl font-black text-emerald-500 mt-1 tracking-tighter italic">{completedVisitsCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-2">
          <div className="h-px flex-1 bg-white/5"></div>
          <div className="flex items-center space-x-2">
            <CalendarDays size={14} className="text-white/20" />
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Cronograma Ativo</h2>
          </div>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>

        {events.length === 0 ? (
          <div className="bg-neutral-900/50 border border-white/5 rounded-[3rem] p-16 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/10 border border-white/5">
              <CalendarDays size={40} strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-black text-white italic uppercase tracking-tight">Roteiro Vazio</p>
              <p className="text-xs text-white/30 max-w-[200px] mx-auto leading-relaxed">Aguarde a atribuição de novos eventos pelos administradores.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((e, idx) => {
              const allAcademiesIds = e.academiesIds || [];
              const allAcademies = allAcademiesIds.map(aid => academies.find(a => a.id === aid)).filter(Boolean) as Academy[];

              const visitedInEvent = visits.filter(v => v.eventId === e.id && v.status === VisitStatus.VISITED);
              const uniqueVisitedIds = new Set(visitedInEvent.map(v => v.academyId));
              const validVisitedCount = Array.from(uniqueVisitedIds).filter(aid => allAcademiesIds.includes(aid)).length;

              const completedIds = Array.from(uniqueVisitedIds).filter(aid => allAcademiesIds.includes(aid));
              const pendingAcademies = allAcademies.filter(a => !completedIds.includes(a.id));
              const finishedAcademies = allAcademies.filter(a => completedIds.includes(a.id));
              const progress = Math.round((validVisitedCount / (allAcademiesIds.length || 1)) * 100);

              return (
                <div
                  key={e.id}
                  className="group relative animate-in slide-in-from-bottom-8 duration-700"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {/* Event Card Header - Integrated Feel */}
                  <div className="mb-4 flex items-end justify-between px-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{e.name}</h3>
                      </div>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">{e.city} • {e.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-2 mb-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Progresso</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{progress}%</span>
                      </div>
                      <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:border-white/20">
                    {/* Event Content */}
                    <div className="p-2 space-y-2">
                      {/* Pendentes */}
                      {pendingAcademies.map(a => {
                        const isActive = activeVisit?.academyId === a.id && activeVisit?.eventId === e.id;
                        return (
                          <div
                            key={a.id}
                            onClick={() => handleAcademyClick(e.id, a.id)}
                            className={cn(
                              "relative group m-1 p-4 flex justify-between items-center rounded-2xl cursor-pointer transition-all duration-500 active:scale-[0.98]",
                              isActive
                                ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20"
                                : "bg-white/5 hover:bg-white/[0.08] text-white/90 border border-white/5"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={cn("font-black text-sm tracking-tight truncate uppercase", isActive ? "text-white" : "text-white/80")}>
                                  {a.name}
                                </p>
                                {isActive && <Loader2 size={12} className="animate-spin opacity-50 ml-2 shrink-0" />}
                              </div>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <p className={cn("text-[9px] font-bold truncate opacity-60 uppercase tracking-widest", isActive ? "text-white" : "text-white/40")}>
                                  {a.responsible}
                                </p>
                                <span className="text-[8px] opacity-20">•</span>
                                <p className={cn("text-[9px] font-bold opacity-60 uppercase tracking-widest", isActive ? "text-white" : "text-white/40")}>
                                  {a.city}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                              isActive ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"
                            )}>
                              <ChevronRight size={18} strokeWidth={3} className={cn("transition-transform group-active:translate-x-1", isActive ? "text-white" : "text-white/20")} />
                            </div>
                          </div>
                        );
                      })}

                      {pendingAcademies.length === 0 && (
                        <div className="py-6 flex items-center justify-center">
                          <div className="px-4 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center space-x-2">
                            <CheckCircle2 size={10} className="text-emerald-500/40" />
                            <span className="text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.2em]">Roteiro Concluído</span>
                          </div>
                        </div>
                      )}

                      {/* Concluídas (Simplified list with better styling) */}
                      {finishedAcademies.length > 0 && (
                        <div className="m-1 pt-6 pb-2 border-t border-white/5">
                          <div className="flex items-center justify-between px-3 mb-4">
                            <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Visitas Realizadas</h4>
                            <span className="text-[9px] font-black text-emerald-500/40 uppercase bg-emerald-500/5 px-2 py-0.5 rounded-full">
                              {finishedAcademies.length} Academias
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 px-2">
                            {finishedAcademies.map(a => {
                              const visit = visits.find(v => v.eventId === e.id && v.academyId === a.id);
                              return (
                                <div
                                  key={a.id}
                                  onClick={() => handleAcademyClick(e.id, a.id)}
                                  className="px-4 py-2 bg-white/[0.03] border border-white/5 rounded-full flex items-center space-x-2 active:scale-95 transition-all group/done hover:bg-white/5"
                                >
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    visit?.temperature === AcademyTemperature.HOT ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-emerald-500/40'
                                  )}></div>
                                  <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter truncate max-w-[100px] group-hover/done:text-white/60 transition-colors">{a.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
