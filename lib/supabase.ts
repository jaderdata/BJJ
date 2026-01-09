import { createClient } from '@supabase/supabase-js';
import { Academy, Event, Visit, FinanceRecord, Voucher } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdtkjfljiugjvixiarka.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XcIl9FFEJXqd_w4QTZTWcw_ZYW9OhZU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
            endDate: e.end_date || e.event_date
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
            end_date: event.endDate
        }).select().single();
        if (error) throw error;
        return {
            ...data,
            salespersonId: data.salesperson_id,
            academiesIds: [],
            date: data.event_date,
            startDate: data.start_date,
            endDate: data.end_date
        };
    },

    async updateEvent(id: string, event: Partial<Event>) {
        const { data, error } = await supabase.from('events').update({
            name: event.name,
            city: event.city,
            state: event.state,
            address: event.address,
            status: event.status,
            salesperson_id: event.salespersonId || null,
            event_date: event.startDate || event.date,
            start_date: event.startDate,
            end_date: event.endDate
        }).eq('id', id).select().single();
        if (error) throw error;
        return {
            ...data,
            salespersonId: data.salesperson_id,
            date: data.event_date
        };
    },

    async deleteEvent(id: string) {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
    },

    // EVENT ACADEMIES (Junction)
    async getEventAcademies(eventId: string) {
        const { data, error } = await supabase.from('event_academies').select('academy_id').eq('event_id', eventId);
        if (error) throw error;
        return data.map((row: any) => row.academy_id);
    },

    async addEventAcademy(eventId: string, academyId: string) {
        const { error } = await supabase.from('event_academies').insert({
            event_id: eventId,
            academy_id: academyId
        });
        if (error) throw error;
    },

    async removeEventAcademy(eventId: string, academyId: string) {
        const { error } = await supabase.from('event_academies').delete().match({
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
            startedAt: v.started_at,
            finishedAt: v.finished_at,
            vouchersGenerated: v.vouchers_generated
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
            vouchers_generated: visit.vouchersGenerated
        }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async upsertVisit(visit: Partial<Visit>) {
        const payload = {
            id: visit.id,
            event_id: visit.eventId,
            academy_id: visit.academyId,
            salesperson_id: visit.salespersonId,
            status: visit.status,
            started_at: visit.startedAt,
            finished_at: visit.finishedAt,
            notes: visit.notes,
            temperature: visit.temperature,
            vouchers_generated: visit.vouchersGenerated
        };
        // Check if ID is a valid UUID. If not (e.g. legacy mock ID), treat as new insert.
        const isValidUUID = (id?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

        if (!payload.id || !isValidUUID(payload.id)) {
            delete payload.id; // Let DB generate it or use insert
            const { data, error } = await supabase.from('visits').insert(payload).select().single();
            if (error) throw error;
            return { ...data, eventId: data.event_id, academyId: data.academy_id, salespersonId: data.salesperson_id, startedAt: data.started_at, finishedAt: data.finished_at, vouchersGenerated: data.vouchers_generated };
        }

        const { data, error } = await supabase.from('visits').upsert(payload).select().single();
        if (error) throw error;
        return { ...data, eventId: data.event_id, academyId: data.academy_id, salespersonId: data.salesperson_id, startedAt: data.started_at, finishedAt: data.finished_at, vouchersGenerated: data.vouchers_generated };
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
        const { data, error } = await supabase.from('finance_records').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((f: any) => ({
            ...f,
            eventId: f.event_id,
            salespersonId: f.salesperson_id,
            updatedAt: f.updated_at
        }));
    },

    async createFinance(record: Partial<FinanceRecord>) {
        const { data, error } = await supabase.from('finance_records').insert({
            event_id: record.eventId,
            salesperson_id: record.salespersonId,
            amount: record.amount,
            status: record.status,
            updated_at: record.updatedAt
        }).select().single();
        if (error) throw error;
        return { ...data, eventId: data.event_id, salespersonId: data.salesperson_id, updatedAt: data.updated_at };
    },

    async updateFinance(id: string, record: Partial<FinanceRecord>) {
        const { data, error } = await supabase.from('finance_records').update({
            amount: record.amount,
            status: record.status,
            updated_at: record.updatedAt
        }).eq('id', id).select().single();
        if (error) throw error;
        return { ...data, eventId: data.event_id, salespersonId: data.salesperson_id, updatedAt: data.updated_at };
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
