import { Academy, Event, Visit, FinanceRecord, Voucher, VisitStatus } from '../types';
import { supabase } from './supabase-client';

export { supabase };

export const DatabaseService = {
    // ACADEMIES
    async getAcademies() {
        const { data, error } = await supabase.from('academies').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async createAcademies(academies: Partial<Academy>[]) {
        const payload = academies.map(a => ({
            name: a.name,
            address: a.address,
            city: a.city,
            state: a.state,
            responsible: a.responsible,
            phone: a.phone
        }));
        const { data, error } = await supabase.from('academies').insert(payload).select();
        if (error) throw error;
        return data;
    },

    async createAcademy(academy: Partial<Academy>) {
        const { data, error } = await supabase.from('academies').insert({
            name: academy.name,
            address: academy.address,
            city: academy.city,
            state: academy.state,
            responsible: academy.responsible,
            phone: academy.phone
        }).select().single();
        if (error) throw error;
        return data;
    },

    async updateAcademy(id: string, academy: Partial<Academy>) {
        const { data, error } = await supabase.from('academies').update({
            name: academy.name,
            address: academy.address,
            city: academy.city,
            state: academy.state,
            responsible: academy.responsible,
            phone: academy.phone
        }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteAcademy(id: string) {
        const { error } = await supabase.from('academies').delete().eq('id', id);
        if (error) throw error;
    },

    // USERS (Secure RPCs)
    async getProfile(userId: string) {
        const { data, error } = await supabase.rpc('get_profile', { p_user_id: userId });
        if (error) throw error;
        // RPC returns an array of records
        if (data && data.length > 0) {
            const u = data[0];
            return {
                ...u,
                photoUrl: u.photo_url
            };
        }
        return null;
    },

    async getSalespersons() {
        const { data, error } = await supabase
            .from('app_users')
            .select('id, name, email')
            .eq('role', 'SALES');
        if (error) throw error;
        return data.map((u: any) => ({ ...u, role: 'SALES', status: 'ACTIVE' }));
    },

    async getAdmins() {
        const { data, error } = await supabase
            .from('app_users')
            .select('id, name, email')
            .eq('role', 'ADMIN');
        if (error) throw error;
        return data.map((u: any) => ({ ...u, role: 'ADMIN', status: 'ACTIVE' }));
    },

    // EVENTS
    async getEvents() {
        const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        // Map snake_case to camelCase
        return data.map((e: any) => ({
            ...e,
            salespersonId: e.salesperson_id,
            academiesIds: [],
            date: e.event_date,
            startDate: e.start_date || e.event_date,
            endDate: e.end_date || e.event_date,
            photoUrl: e.photo_url,
            isTest: e.is_test
        }));
    },

    async createEvent(event: Partial<Event>) {
        const { data, error } = await supabase.from('events').insert({
            name: event.name,
            city: event.city,
            state: event.state,
            address: event.address,
            status: event.status,
            salesperson_id: event.salespersonId || null,
            event_date: event.startDate || event.date,
            start_date: event.startDate,
            end_date: event.endDate,
            photo_url: event.photoUrl,
            is_test: event.isTest
        }).select().single();
        if (error) throw error;
        return {
            ...data,
            salespersonId: data.salesperson_id,
            academiesIds: [],
            date: data.event_date,
            startDate: data.start_date,
            endDate: data.end_date,
            photoUrl: data.photo_url,
            isTest: data.is_test
        };
    },

    async updateEvent(id: string, event: Partial<Event>) {
        const { error } = await supabase.from('events').update({
            name: event.name,
            city: event.city,
            state: event.state,
            address: event.address,
            status: event.status,
            salesperson_id: event.salespersonId || null,
            event_date: event.startDate || event.date,
            start_date: event.startDate,
            end_date: event.endDate,
            photo_url: event.photoUrl || null,
            is_test: event.isTest
        }).eq('id', id);
        if (error) throw error;
    },

    async deleteEvent(id: string) {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
    },

    // EVENT ACADEMIES (Junction)
    async getEventAcademies(eventId: string) {
        const { data, error } = await supabase
            .from('event_academies')
            .select('academy_id')
            .eq('event_id', eventId)
            .eq('is_active', true);
        if (error) throw error;
        return data.map((row: any) => row.academy_id);
    },

    async addEventAcademy(eventId: string, academyId: string) {
        const { error } = await supabase.from('event_academies').upsert({
            event_id: eventId,
            academy_id: academyId,
            is_active: true
        }, { onConflict: 'event_id,academy_id' });
        if (error) throw error;
    },

    async removeEventAcademy(eventId: string, academyId: string) {
        const { error } = await supabase
            .from('event_academies')
            .update({ is_active: false })
            .match({
                event_id: eventId,
                academy_id: academyId
            });
        if (error) throw error;
    },

    // VISITS
    async getVisits() {
        const { data, error } = await supabase.from('visits').select('*');
        if (error) throw error;
        return data.map((v: any) => ({
            ...v,
            eventId: v.event_id,
            academyId: v.academy_id,
            salespersonId: v.salesperson_id,
            status: v.status,
            startedAt: v.started_at,
            finishedAt: v.finished_at,
            summary: v.summary,
            contactPerson: v.contact_person,
            vouchersGenerated: v.vouchers_generated,
            photos: v.photos || [],
            leftBanner: v.left_banner,
            leftFlyers: v.left_flyers
        }));
    },

    async updateVisit(id: string, visit: Partial<Visit>) {
        // Not used directly if we use upsert, but good to have
        const { data, error } = await supabase.from('visits').update({
            status: visit.status,
            started_at: visit.startedAt,
            finished_at: visit.finishedAt,
            notes: visit.notes,
            temperature: visit.temperature,
            contact_person: visit.contactPerson,
            vouchers_generated: visit.vouchersGenerated
        }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async upsertVisit(visit: Partial<Visit>) {
        console.log("🔄 [DatabaseService] upsertVisit chamado com:", visit);

        const payload = {
            id: visit.id,
            event_id: visit.eventId,
            academy_id: visit.academyId,
            salesperson_id: visit.salespersonId,
            status: visit.status,
            started_at: visit.startedAt,
            finished_at: visit.finishedAt,
            notes: visit.notes,
            summary: visit.summary,
            temperature: visit.temperature,
            contact_person: visit.contactPerson,
            vouchers_generated: visit.vouchersGenerated,
            photos: visit.photos || [],
            left_banner: visit.leftBanner,
            left_flyers: visit.leftFlyers
        };

        // Check if ID is a valid UUID. If not (e.g. legacy mock ID), treat as new insert.
        const isValidUUID = (id?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

        try {
            if (!payload.id || !isValidUUID(payload.id)) {
                console.log("🚀 [DatabaseService] ID inválido ou ausente, tentando INSERT...");
                delete payload.id; // Let DB generate it or use insert

                // Try insert. If unique constraint exists, this might fail with 409 Conflict.
                const { data, error } = await supabase.from('visits').insert(payload).select().single();

                if (error) {
                    console.error("❌ [DatabaseService] Erro no INSERT:", error);
                    // CONFLICT HANDLER: If unique constraint violaton (code 23505)
                    if (error.code === '23505') {
                        console.warn("⚠️ [DatabaseService] Conflito de duplicidade detectado. Tentando recuperar visita existente...");

                        // Fetch the existing visit for this Event+Academy
                        const { data: existing, error: fetchError } = await supabase
                            .from('visits')
                            .select()
                            .eq('event_id', payload.event_id)
                            .eq('academy_id', payload.academy_id)
                            .single();

                        if (fetchError || !existing) {
                            throw new Error(`Erro ao recuperar visita existente após conflito: ${fetchError?.message}`);
                        }

                        // Retry as UPDATE with the found ID
                        console.log("🔄 [DatabaseService] Visita existente encontrada. Atualizando ID:", existing.id);
                        return await this.upsertVisit({ ...visit, id: existing.id });
                    }
                    throw error;
                }
                // Map back to camelCase and return
                return {
                    ...data,
                    eventId: data.event_id,
                    academyId: data.academy_id,
                    salespersonId: data.salesperson_id,
                    startedAt: data.started_at,
                    finishedAt: data.finished_at,
                    contactPerson: data.contact_person,
                    vouchersGenerated: data.vouchers_generated,
                    leftBanner: data.left_banner,
                    leftFlyers: data.left_flyers
                } as Visit;
            }

            console.log("🚀 [DatabaseService] Tentando UPSERT...");
            const { data, error } = await supabase.from('visits').upsert(payload).select().single();
            if (error) {
                console.error("❌ [DatabaseService] Erro no UPSERT:", error);
                throw error;
            }

            // Map back to camelCase and return
            return {
                ...data,
                eventId: data.event_id,
                academyId: data.academy_id,
                salespersonId: data.salesperson_id,
                startedAt: data.started_at,
                finishedAt: data.finished_at,
                contactPerson: data.contact_person,
                vouchersGenerated: data.vouchers_generated,
                leftBanner: data.left_banner,
                leftFlyers: data.left_flyers
            } as Visit;

        } catch (error: any) {
            console.error("❌ [DatabaseService] Erro em upsertVisit:", error);
            throw error;
        }
    },

    // VOUCHERS
    async getVouchers() {
        const { data, error } = await supabase.from('vouchers').select('*');
        if (error) throw error;
        return data.map((v: any) => ({
            ...v,
            eventId: v.event_id,
            academyId: v.academy_id,
            visitId: v.visit_id,
            createdAt: v.created_at
        }));
    },

    async createVouchers(vouchers: Partial<Voucher>[]) {
        const payload = vouchers.map(v => ({
            code: v.code,
            event_id: v.eventId,
            academy_id: v.academyId,
            visit_id: v.visitId,
            created_at: v.createdAt
        }));
        const { error } = await supabase.from('vouchers').insert(payload);
        if (error) throw error;
    },

    // FINANCE
    async getFinance() {
        const { data, error } = await supabase.from('finance_records').select('*').order('updated_at', { ascending: false });
        if (error) throw error;
        return data.map((f: any) => ({
            ...f,
            eventId: f.event_id,
            salespersonId: f.salesperson_id,
            updatedAt: f.updated_at || f.created_at,
            observation: f.observation
        }));
    },

    async createFinance(record: Partial<FinanceRecord>) {
        const { data, error } = await supabase.from('finance_records').insert({
            event_id: record.eventId,
            salesperson_id: record.salespersonId,
            amount: record.amount,
            status: record.status,
            updated_at: record.updatedAt,
            observation: record.observation
        }).select().single();
        if (error) throw error;
        return { ...data, eventId: data.event_id, salespersonId: data.salesperson_id, updatedAt: data.updated_at || data.created_at, observation: data.observation };
    },

    async updateFinance(id: string, record: Partial<FinanceRecord>) {
        const { data, error } = await supabase.from('finance_records').update({
            event_id: record.eventId,
            salesperson_id: record.salespersonId,
            amount: record.amount,
            status: record.status,
            updated_at: record.updatedAt,
            observation: record.observation
        }).eq('id', id).select().single();
        if (error) throw error;
        return { ...data, eventId: data.event_id, salespersonId: data.salesperson_id, updatedAt: data.updated_at || data.created_at, observation: data.observation };
    },

    async deleteFinance(id: string) {
        const { error } = await supabase.from('finance_records').delete().eq('id', id);
        if (error) throw error;
    },

    // NOTIFICATIONS
    async getNotifications(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            message: n.message,
            read: n.read,
            timestamp: n.created_at
        }));
    },

    async createNotification(userId: string, message: string) {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                message,
                read: false
            })
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            userId: data.user_id,
            message: data.message,
            read: data.read,
            timestamp: data.created_at
        };
    },

    async markNotificationAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
        if (error) throw error;
    },

    async getPendingInvites() {
        const { data, error } = await supabase
            .from('auth_tokens')
            .select('*')
            .eq('type', 'ACTIVATION')
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as any[];
    },

    async updateUser(id: string, updates: any) {
        const { data, error } = await supabase
            .from('app_users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteUser(id: string) {
        const { error } = await supabase
            .from('app_users')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
    async deleteFromAllowlist(email: string) {
        const { error } = await supabase
            .from('app_allowlist')
            .delete()
            .eq('email', email);
        if (error) throw error;
    },

    // SETTINGS
    async getSetting(key: string) {
        const { data, error } = await supabase.from('system_settings').select('value').eq('key', key).single();
        if (error && error.code !== 'PGRST116') throw error; // Ignore not found
        return data?.value || null;
    },

    async setSetting(key: string, value: any) {
        const { error } = await supabase.from('system_settings').upsert({
            key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
        if (error) throw error;
    },

    async updateSetting(key: string, value: any) {
        const { data, error } = await supabase.from('system_settings').upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        return data;
    },

    // STORAGE - Event Photos
    async uploadEventPhoto(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `event-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('events')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('events')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async deleteEventPhoto(photoUrl: string) {
        if (!photoUrl) return;

        // Extract file path from URL
        const urlParts = photoUrl.split('/storage/v1/object/public/events/');
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];
        const { error } = await supabase.storage
            .from('events')
            .remove([filePath]);

        if (error) console.error('Error deleting photo:', error);
    },

    async uploadUserProfilePhoto(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            // Fallback to visit-photos if avatars bucket doesn't exist
            const { error: fallbackError } = await supabase.storage
                .from('visit-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (fallbackError) throw fallbackError;

            const { data } = supabase.storage
                .from('visit-photos')
                .getPublicUrl(filePath);

            return data.publicUrl;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async uploadVisitPhoto(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('visit-photos')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('visit-photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async getLastVisit(academyId: string): Promise<Visit | null> {
        const { data, error } = await supabase
            .from('visits')
            .select('*')
            .eq('academy_id', academyId)
            .eq('status', VisitStatus.VISITED)
            .order('finished_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return {
            ...data,
            eventId: data.event_id,
            academyId: data.academy_id,
            salespersonId: data.salesperson_id,
            status: data.status,
            startedAt: data.started_at,
            finishedAt: data.finished_at,
            summary: data.summary,
            contactPerson: data.contact_person,
            vouchersGenerated: data.vouchers_generated,
            photos: data.photos || [],
            leftBanner: data.left_banner,
            leftFlyers: data.left_flyers
        };
    },

    async deleteVisitByEventAndAcademy(eventId: string, academyId: string) {
        console.log(`🗑️ [DatabaseService] Deletando visita para evento ${eventId} e academia ${academyId}`);
        const { error } = await supabase
            .from('visits')
            .delete()
            .match({ event_id: eventId, academy_id: academyId });

        if (error) {
            console.error("❌ [DatabaseService] Erro ao deletar visita:", error);
            throw error;
        }
        console.log("✅ [DatabaseService] Visita deletada com sucesso");
    },

    async finalizeVisitTransaction(visit: Partial<Visit>, newVouchers: Partial<Voucher>[]) {
        console.log("🚦 [DatabaseService] Iniciando transação de finalização...");

        // 1. Salvar Visita (Status: VISITED)
        const savedVisit = await this.upsertVisit(visit);
        if (!savedVisit) throw new Error("Falha ao salvar a visita.");

        console.log("✅ [DatabaseService] Visita salva com ID:", savedVisit.id);

        // 2. Tentar salvar Vouchers
        if (newVouchers.length > 0) {
            try {
                // Atribui o ID da visita recém-salva aos vouchers
                const vouchersWithId = newVouchers.map(v => ({ ...v, visitId: savedVisit.id }));
                await this.createVouchers(vouchersWithId as Voucher[]);
                console.log("✅ [DatabaseService] Vouchers criados com sucesso.");
            } catch (error: any) {
                console.error("❌ [DatabaseService] ERRO CRÍTICO: Falha ao criar vouchers após salvar visita!", error);

                // Gravar log de erro na visita
                await supabase.from('visits').update({
                    summary: `[ERRO DE SISTEMA] Vouchers não foram gerados: ${error.message}. RESUMO ORIGINAL: ${visit.summary || ''}`
                }).eq('id', savedVisit.id);

                throw new Error(`A visita foi salva, mas Ocorreu um erro ao gerar os vouchers: ${error.message}`);
            }
        }

        return savedVisit;
    }

};

export const AuthService = {
    async login(email: string, password: string) {
        const { data, error } = await supabase.rpc('auth_login', {
            p_email: email.trim().toLowerCase(),
            p_password: password
        });
        if (error) throw error;
        return data; // Returns { success: boolean, message?: string, user?: object }
    },

    async requestAccess(email: string) {
        const { data, error } = await supabase.rpc('auth_request_access', {
            p_email: email.trim().toLowerCase()
        });
        if (error) throw error;
        return data;
    },

    async activateUser(token: string, password: string, name: string) {
        const { data, error } = await supabase.rpc('auth_activate_user', {
            p_token: token,
            p_password: password,
            p_name: name
        });
        if (error) throw error;
        return data;
    },

    async generateInvite(email: string, role: string) {
        const { data, error } = await supabase.rpc('auth_generate_invite', {
            p_email: email.trim().toLowerCase(),
            p_role: role
        });
        if (error) throw error;
        return data;
    },

    async revokeInvite(email: string) {
        const { data, error } = await supabase.rpc('auth_revoke_invite', {
            p_email: email.trim().toLowerCase()
        });
        if (error) throw error;
        return data;
    },

    async requestReset(email: string) {
        const { data, error } = await supabase.rpc('auth_request_reset', {
            p_email: email.trim().toLowerCase()
        });
        if (error) throw error;
        return data;
    },

    async executeReset(token: string, password: string) {
        const { data, error } = await supabase.rpc('auth_reset_password', {
            p_token: token,
            p_password: password
        });
        if (error) throw error;
        return data;
    },

    // Admin Methods
    async getAllowlist() {
        const { data, error } = await supabase.from('app_allowlist').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async addToAllowlist(email: string, role: 'ADMIN' | 'SALES') {
        const { data, error } = await supabase.from('app_allowlist').insert({
            email: email.trim().toLowerCase(),
            role,
            status: 'ACTIVE'
        }).select().single();
        if (error) throw error;
        return data;
    },

    async toggleAllowlistStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const { data, error } = await supabase.from('app_allowlist').update({ status: newStatus }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async getAuthLogs() {
        const { data, error } = await supabase.from('auth_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        return data;
    }
};

// ============================================================================
// ELEVATION SERVICE - Sistema de Elevação Temporária de Privilégios
// ============================================================================

export interface ElevationSession {
    sessionId: string;
    elevated: boolean;
    elevatedAt?: string;
    expiresAt?: string;
    reason?: string;
    timeRemainingSeconds?: number;
}

export const ElevationService = {
    /**
     * Verifica se o usuário possui sessão administrativa ativa
     */
    async checkElevation(userId: string): Promise<ElevationSession> {
        const { data, error } = await supabase.rpc('check_elevation', {
            p_user_id: userId
        });

        if (error) {
            console.error('Error checking elevation:', error);
            return { elevated: false, sessionId: '' };
        }

        return {
            sessionId: data.session_id || '',
            elevated: data.elevated || false,
            elevatedAt: data.elevated_at,
            expiresAt: data.expires_at,
            reason: data.reason,
            timeRemainingSeconds: data.time_remaining_seconds
        };
    },

    /**
     * Solicita elevação de privilégios (requer senha)
     */
    async requestElevation(
        userId: string,
        password: string,
        reason?: string,
        durationMinutes: number = 30
    ): Promise<{ success: boolean; message: string; session?: ElevationSession }> {
        const { data, error } = await supabase.rpc('request_elevation', {
            p_user_id: userId,
            p_password: password,
            p_reason: reason,
            p_duration_minutes: durationMinutes,
            p_ip_address: null, // Could be populated from client if needed
            p_user_agent: navigator.userAgent
        });

        if (error) {
            console.error('Error requesting elevation:', error);
            return {
                success: false,
                message: error.message || 'Erro ao solicitar elevação'
            };
        }

        if (!data.success) {
            return {
                success: false,
                message: data.message
            };
        }

        return {
            success: true,
            message: data.message,
            session: {
                sessionId: data.session_id,
                elevated: true,
                expiresAt: data.expires_at,
                timeRemainingSeconds: durationMinutes * 60
            }
        };
    },

    /**
     * Revoga sessão administrativa ativa
     */
    async revokeElevation(userId: string, reason: string = 'Manual revocation'): Promise<{ success: boolean; message: string }> {
        const { data, error } = await supabase.rpc('revoke_elevation', {
            p_user_id: userId,
            p_reason: reason
        });

        if (error) {
            console.error('Error revoking elevation:', error);
            return {
                success: false,
                message: error.message || 'Erro ao revogar elevação'
            };
        }

        return {
            success: data.success,
            message: data.message
        };
    },

    /**
     * Registra ação administrativa para auditoria
     */
    async logAdminAction(
        userId: string,
        action: string,
        resourceType?: string,
        resourceId?: string,
        details?: any
    ): Promise<void> {
        try {
            await supabase.rpc('log_admin_action', {
                p_user_id: userId,
                p_action: action,
                p_resource_type: resourceType,
                p_resource_id: resourceId,
                p_details: details ? JSON.stringify(details) : null,
                p_ip_address: null,
                p_user_agent: navigator.userAgent
            });
        } catch (error) {
            console.error('Error logging admin action:', error);
            // Non-blocking - don't throw
        }
    },

    /**
     * Busca logs de auditoria administrativa
     */
    async getAuditLogs(limit: number = 50): Promise<any[]> {
        const { data, error } = await supabase
            .from('admin_audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Busca sessões administrativas (ativas e históricas)
     */
    async getAdminSessions(userId?: string, limit: number = 50): Promise<any[]> {
        let query = supabase
            .from('admin_sessions')
            .select('*')
            .order('elevated_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching admin sessions:', error);
            return [];
        }

        return data || [];
    }
};

