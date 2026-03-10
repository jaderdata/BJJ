import {
    Visit,
    Event,
    Academy,
    Voucher,
    VisitStatus,
    AcademyTemperature,
    ContactPerson,
} from '../types';

// ============================================================================
// FORMATTING
// ============================================================================

const COUNTRY_CODES: Record<string, string> = { US: '1', BR: '55', PT: '351' };

/**
 * Formata número de telefone com máscara por país.
 */
export function formatPhone(
    phone: string,
    country: 'BR' | 'US' | 'PT'
): string {
    const clean = phone.replace(/\D/g, '');
    const prefix = COUNTRY_CODES[country] || '1';

    if (country === 'US' && clean.length === 10) {
        return `+${prefix} (${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    if (country === 'BR' && clean.length >= 10) {
        const isMobile = clean.length === 11;
        return `+${prefix} (${clean.slice(0, 2)}) ${clean.slice(2, isMobile ? 7 : 6)}-${clean.slice(isMobile ? 7 : 6)}`;
    }
    if (country === 'PT' && clean.length === 9) {
        return `+${prefix} ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }
    return `+${prefix} ${clean}`;
}

/**
 * Formata minutos em string legível (e.g. "45 min" ou "1h 30m").
 */
export function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

/**
 * Prefixa telefone limpo com código do país.
 */
export function getCleanPhone(
    phone: string,
    country: 'BR' | 'US' | 'PT'
): string {
    const clean = String(phone).replace(/"/g, '').replace(/\D/g, '');
    const prefix = COUNTRY_CODES[country] || '1';
    return `${prefix}${clean}`;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valida se string é UUID v4 válido.
 */
export function isValidUUID(id?: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id || ''
    );
}

/**
 * Verifica se um link de voucher expirou (24h).
 */
export function isExpired(createdAt: number, now?: number): boolean {
    const currentTime = now ?? Date.now();
    const expirationTime = 24 * 60 * 60 * 1000;
    return createdAt > 0 && currentTime - createdAt > expirationTime;
}

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calcula porcentagem com proteção contra divisão por zero.
 */
export function calculateProgress(completed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((completed / total) * 100);
}

/**
 * Filtra apenas academias ativas de uma lista de IDs.
 */
export function filterActiveAcademies(
    academies: Academy[],
    academyIds: string[]
): Academy[] {
    return academyIds
        .map((aid) => academies.find((a) => a.id === aid))
        .filter((a): a is Academy => !!a && a.status === 'ACTIVE');
}

/**
 * Conta visitas concluídas (excluindo eventos teste, só academias ativas).
 */
export function countCompletedVisits(
    visits: Visit[],
    events: Event[],
    academies: Academy[]
): number {
    const nonTestEvents = events.filter((e) => !e.isTest);

    return nonTestEvents.reduce((acc, e) => {
        const visitedInEvent = visits.filter(
            (v) => v.eventId === e.id && v.status === VisitStatus.VISITED
        );
        const uniqueVisitedIds = new Set(visitedInEvent.map((v) => v.academyId));

        const validVisitedCount = Array.from(uniqueVisitedIds).filter((aid) => {
            if (!e.academiesIds.includes(aid)) return false;
            const a = academies.find((ac) => ac.id === aid);
            return a && a.status === 'ACTIVE';
        }).length;

        return acc + validVisitedCount;
    }, 0);
}

/**
 * Conta total de academias ativas alocadas em eventos não-teste.
 */
export function countTotalActiveAcademies(
    events: Event[],
    academies: Academy[]
): number {
    const nonTestEvents = events.filter((e) => !e.isTest);

    return nonTestEvents.reduce((acc, e) => {
        const activeCount = (e.academiesIds || []).filter((aid) => {
            const a = academies.find((ac) => ac.id === aid);
            return a && a.status === 'ACTIVE';
        }).length;
        return acc + activeCount;
    }, 0);
}

/**
 * Filtra visitas que pertencem a um vendedor (excluindo eventos teste).
 */
export function filterVendorVisits(
    visits: Visit[],
    events: Event[],
    vendorId: string
): Visit[] {
    return visits.filter((v) => {
        const event = events.find((e) => e.id === v.eventId);
        if (event?.isTest) return false;

        // A visit strictly belongs to a vendor if they were the one who made it
        // Do NOT check event?.salespersonIds here, otherwise a newly added vendor 
        // to an ongoing event absorbs all past visits from other vendors.
        return v.salespersonId === vendorId;
    });
}

/**
 * Conta vouchers que pertencem a um vendedor (exclui test events).
 */
export function countVendorVouchers(
    vouchers: Voucher[],
    events: Event[],
    visits: Visit[],
    vendorId: string
): number {
    return vouchers.filter((v) => {
        const event = events.find((e) => e.id === v.eventId);
        if (event?.isTest) return false;

        const visit = visits.find((vis) => vis.id === v.visitId);
        if (!visit) return false;

        // The voucher should be counted for the vendor only if they made the parent visit
        if (visit.salespersonId !== vendorId) return false;

        return visit.vouchersGenerated?.includes(v.code);
    }).length;
}

/**
 * Calcula breakdown de temperatura das visitas concluídas.
 */
export function calculateTemperatureStats(
    completedVisits: Visit[]
): Record<AcademyTemperature, number> {
    const counts: Record<AcademyTemperature, number> = {
        [AcademyTemperature.HOT]: 0,
        [AcademyTemperature.WARM]: 0,
        [AcademyTemperature.COLD]: 0,
    };
    completedVisits.forEach((v) => {
        const temp = v.temperature || AcademyTemperature.WARM;
        if (counts[temp] !== undefined) counts[temp]++;
    });
    return counts;
}

/**
 * Calcula breakdown de tipo de contato das visitas concluídas.
 */
export function calculateContactStats(
    completedVisits: Visit[]
): Record<ContactPerson, number> {
    const counts: Record<ContactPerson, number> = {
        [ContactPerson.OWNER]: 0,
        [ContactPerson.TEACHER]: 0,
        [ContactPerson.STAFF]: 0,
        [ContactPerson.NOBODY]: 0,
    };
    completedVisits.forEach((v) => {
        const contact = v.contactPerson || ContactPerson.NOBODY;
        if (counts[contact] !== undefined) counts[contact]++;
    });
    return counts;
}

/**
 * Calcula a duração real de uma visita, limitando ao piso de 5 min e teto de 60 min.
 * Retorna null se não houver datas válidas disponíveis.
 */
export function calculateTrueVisitDuration(startedAt?: string, finishedAt?: string): number | null {
    if (!startedAt || !finishedAt) return null;

    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    let minutes = Math.round((end - start) / 1000 / 60);

    if (minutes < 5) minutes = 5;
    if (minutes > 60) minutes = 60;

    return minutes;
}

/**
 * Calcula tempo médio de visita em minutos utilizando a trava de (5-60min).
 */
export function calculateAvgVisitMinutes(completedVisits: Visit[]): number {
    const durations = completedVisits
        .map(v => calculateTrueVisitDuration(v.startedAt, v.finishedAt))
        .filter((d): d is number => d !== null);

    if (durations.length === 0) return 0;

    const totalMinutes = durations.reduce((sum, d) => sum + d, 0);
    return Math.round(totalMinutes / durations.length);
}
