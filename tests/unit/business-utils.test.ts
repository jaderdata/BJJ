import { describe, it, expect } from 'vitest';
import {
    formatPhone,
    formatTime,
    getCleanPhone,
    isValidUUID,
    isExpired,
    calculateProgress,
    filterActiveAcademies,
    countCompletedVisits,
    countTotalActiveAcademies,
    filterVendorVisits,
    countVendorVouchers,
    calculateTemperatureStats,
    calculateContactStats,
    calculateAvgVisitMinutes,
} from '@/lib/business-utils';
import {
    VisitStatus,
    AcademyTemperature,
    ContactPerson,
    EventStatus,
    Visit,
    Event,
    Academy,
    Voucher,
} from '@/types';

// ============================================================================
// HELPERS — Test Data Factories
// ============================================================================

function makeVisit(overrides: Partial<Visit> = {}): Visit {
    return {
        id: 'visit-1',
        eventId: 'event-1',
        academyId: 'academy-1',
        salespersonId: 'vendor-1',
        status: VisitStatus.VISITED,
        vouchersGenerated: [],
        ...overrides,
    };
}

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: 'event-1',
        name: 'Test Event',
        city: 'Orlando',
        state: 'FL',
        address: '123 Main St',
        status: EventStatus.IN_PROGRESS,
        academiesIds: ['academy-1'],
        date: '2026-01-01',
        startDate: '2026-01-01',
        endDate: '2026-01-02',
        isTest: false,
        ...overrides,
    };
}

function makeAcademy(overrides: Partial<Academy> = {}): Academy {
    return {
        id: 'academy-1',
        name: 'Gracie Barra',
        address: '456 Oak Ave',
        city: 'Kissimmee',
        state: 'FL',
        responsible: 'João',
        phone: '4071234567',
        createdAt: '2026-01-01',
        status: 'ACTIVE',
        ...overrides,
    };
}

function makeVoucher(overrides: Partial<Voucher> = {}): Voucher {
    return {
        code: 'ABC123',
        eventId: 'event-1',
        academyId: 'academy-1',
        visitId: 'visit-1',
        createdAt: '2026-01-01',
        ...overrides,
    };
}

// ============================================================================
// formatPhone
// ============================================================================

describe('formatPhone', () => {
    it('formats US phone (10 digits) correctly', () => {
        expect(formatPhone('4076339166', 'US')).toBe('+1 (407) 633-9166');
    });

    it('formats BR mobile phone (11 digits) correctly', () => {
        expect(formatPhone('11987654321', 'BR')).toBe('+55 (11) 98765-4321');
    });

    it('formats BR landline phone (10 digits) correctly', () => {
        expect(formatPhone('1134567890', 'BR')).toBe('+55 (11) 3456-7890');
    });

    it('formats PT phone (9 digits) correctly', () => {
        expect(formatPhone('912345678', 'PT')).toBe('+351 912 345 678');
    });

    it('falls back to prefix + raw for unknown length', () => {
        expect(formatPhone('12345', 'US')).toBe('+1 12345');
    });

    it('strips non-digit characters before formatting', () => {
        expect(formatPhone('(407) 633-9166', 'US')).toBe('+1 (407) 633-9166');
    });
});

// ============================================================================
// formatTime
// ============================================================================

describe('formatTime', () => {
    it('returns minutes for values under 60', () => {
        expect(formatTime(45)).toBe('45 min');
    });

    it('returns hours and minutes for values >= 60', () => {
        expect(formatTime(90)).toBe('1h 30m');
    });

    it('handles exact hours', () => {
        expect(formatTime(120)).toBe('2h 0m');
    });

    it('handles 0 minutes', () => {
        expect(formatTime(0)).toBe('0 min');
    });
});

// ============================================================================
// getCleanPhone
// ============================================================================

describe('getCleanPhone', () => {
    it('prefixes US phone with country code 1', () => {
        expect(getCleanPhone('4076339166', 'US')).toBe('14076339166');
    });

    it('prefixes BR phone with country code 55', () => {
        expect(getCleanPhone('11987654321', 'BR')).toBe('5511987654321');
    });

    it('strips quotes and non-digits', () => {
        expect(getCleanPhone('"(407) 633-9166"', 'US')).toBe('14076339166');
    });
});

// ============================================================================
// isValidUUID
// ============================================================================

describe('isValidUUID', () => {
    it('returns true for valid UUID v4', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('returns true for uppercase UUID', () => {
        expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('returns false for invalid UUID', () => {
        expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isValidUUID('')).toBe(false);
    });

    it('returns false for undefined', () => {
        expect(isValidUUID(undefined)).toBe(false);
    });

    it('returns false for legacy mock IDs', () => {
        expect(isValidUUID('mock-visit-123')).toBe(false);
    });
});

// ============================================================================
// isExpired
// ============================================================================

describe('isExpired', () => {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    it('returns false if within 24 hours', () => {
        const now = Date.now();
        const createdAt = now - TWENTY_FOUR_HOURS + 1000; // 1 second before expiration
        expect(isExpired(createdAt, now)).toBe(false);
    });

    it('returns true if after 24 hours', () => {
        const now = Date.now();
        const createdAt = now - TWENTY_FOUR_HOURS - 1000; // 1 second after expiration
        expect(isExpired(createdAt, now)).toBe(true);
    });

    it('returns false if createdAt is 0', () => {
        expect(isExpired(0)).toBe(false);
    });

    it('returns true at exact 24h boundary + 1ms', () => {
        const now = 100000000;
        const createdAt = now - TWENTY_FOUR_HOURS - 1;
        expect(isExpired(createdAt, now)).toBe(true);
    });
});

// ============================================================================
// calculateProgress
// ============================================================================

describe('calculateProgress', () => {
    it('calculates correct percentage', () => {
        expect(calculateProgress(3, 10)).toBe(30);
    });

    it('returns 0 when total is 0 (division by zero protection)', () => {
        expect(calculateProgress(5, 0)).toBe(0);
    });

    it('returns 100 for fully completed', () => {
        expect(calculateProgress(10, 10)).toBe(100);
    });

    it('rounds to nearest integer', () => {
        expect(calculateProgress(1, 3)).toBe(33);
    });

    it('returns 0 when completed is 0', () => {
        expect(calculateProgress(0, 10)).toBe(0);
    });

    it('returns 0 when total is negative', () => {
        expect(calculateProgress(5, -1)).toBe(0);
    });
});

// ============================================================================
// filterActiveAcademies
// ============================================================================

describe('filterActiveAcademies', () => {
    const academies: Academy[] = [
        makeAcademy({ id: 'a1', status: 'ACTIVE' }),
        makeAcademy({ id: 'a2', status: 'INACTIVE' }),
        makeAcademy({ id: 'a3', status: 'ACTIVE' }),
    ];

    it('returns only active academies from given IDs', () => {
        const result = filterActiveAcademies(academies, ['a1', 'a2', 'a3']);
        expect(result).toHaveLength(2);
        expect(result.map((a) => a.id)).toEqual(['a1', 'a3']);
    });

    it('ignores IDs that do not exist in academy list', () => {
        const result = filterActiveAcademies(academies, ['a1', 'nonexistent']);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('a1');
    });

    it('returns empty when all academies are inactive', () => {
        const inactive = [makeAcademy({ id: 'x1', status: 'INACTIVE' })];
        const result = filterActiveAcademies(inactive, ['x1']);
        expect(result).toHaveLength(0);
    });

    it('returns empty when academyIds is empty', () => {
        const result = filterActiveAcademies(academies, []);
        expect(result).toHaveLength(0);
    });
});

// ============================================================================
// countCompletedVisits
// ============================================================================

describe('countCompletedVisits', () => {
    const academies = [
        makeAcademy({ id: 'a1', status: 'ACTIVE' }),
        makeAcademy({ id: 'a2', status: 'ACTIVE' }),
        makeAcademy({ id: 'a3', status: 'INACTIVE' }),
    ];

    it('counts only visited academies that are active', () => {
        const events = [makeEvent({ id: 'e1', academiesIds: ['a1', 'a2', 'a3'] })];
        const visits = [
            makeVisit({ eventId: 'e1', academyId: 'a1', status: VisitStatus.VISITED }),
            makeVisit({ eventId: 'e1', academyId: 'a2', status: VisitStatus.VISITED }),
            makeVisit({ eventId: 'e1', academyId: 'a3', status: VisitStatus.VISITED }),
        ];
        // a3 is INACTIVE so should not count
        expect(countCompletedVisits(visits, events, academies)).toBe(2);
    });

    it('excludes test events', () => {
        const events = [
            makeEvent({ id: 'e1', academiesIds: ['a1'], isTest: true }),
            makeEvent({ id: 'e2', academiesIds: ['a2'] }),
        ];
        const visits = [
            makeVisit({ eventId: 'e1', academyId: 'a1', status: VisitStatus.VISITED }),
            makeVisit({ eventId: 'e2', academyId: 'a2', status: VisitStatus.VISITED }),
        ];
        expect(countCompletedVisits(visits, events, academies)).toBe(1);
    });

    it('does not double-count duplicate visits to same academy', () => {
        const events = [makeEvent({ id: 'e1', academiesIds: ['a1'] })];
        const visits = [
            makeVisit({ id: 'v1', eventId: 'e1', academyId: 'a1', status: VisitStatus.VISITED }),
            makeVisit({ id: 'v2', eventId: 'e1', academyId: 'a1', status: VisitStatus.VISITED }),
        ];
        expect(countCompletedVisits(visits, events, academies)).toBe(1);
    });

    it('ignores pending visits', () => {
        const events = [makeEvent({ id: 'e1', academiesIds: ['a1'] })];
        const visits = [
            makeVisit({ eventId: 'e1', academyId: 'a1', status: VisitStatus.PENDING }),
        ];
        expect(countCompletedVisits(visits, events, academies)).toBe(0);
    });

    it('returns 0 when no visits exist', () => {
        const events = [makeEvent({ id: 'e1', academiesIds: ['a1'] })];
        expect(countCompletedVisits([], events, academies)).toBe(0);
    });
});

// ============================================================================
// countTotalActiveAcademies
// ============================================================================

describe('countTotalActiveAcademies', () => {
    const academies = [
        makeAcademy({ id: 'a1', status: 'ACTIVE' }),
        makeAcademy({ id: 'a2', status: 'INACTIVE' }),
        makeAcademy({ id: 'a3', status: 'ACTIVE' }),
    ];

    it('counts only active academies across non-test events', () => {
        const events = [
            makeEvent({ id: 'e1', academiesIds: ['a1', 'a2'] }),
            makeEvent({ id: 'e2', academiesIds: ['a3'] }),
        ];
        expect(countTotalActiveAcademies(events, academies)).toBe(2); // a1 + a3
    });

    it('excludes test events entirely', () => {
        const events = [
            makeEvent({ id: 'e1', academiesIds: ['a1'], isTest: true }),
            makeEvent({ id: 'e2', academiesIds: ['a3'] }),
        ];
        expect(countTotalActiveAcademies(events, academies)).toBe(1); // only a3
    });

    it('returns 0 when no events', () => {
        expect(countTotalActiveAcademies([], academies)).toBe(0);
    });
});

// ============================================================================
// filterVendorVisits
// ============================================================================

describe('filterVendorVisits', () => {
    it('filters visits by vendor salespersonId', () => {
        const events = [makeEvent({ id: 'e1', salespersonIds: ['other'] })];
        const visits = [
            makeVisit({ id: 'v1', salespersonId: 'vendor-1', eventId: 'e1' }),
            makeVisit({ id: 'v2', salespersonId: 'vendor-2', eventId: 'e1' }),
        ];
        const result = filterVendorVisits(visits, events, 'vendor-1');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('v1');
    });

    it('falls back to event salespersonId when visit has no salesperson', () => {
        const events = [makeEvent({ id: 'e1', salespersonIds: ['vendor-1'] })];
        const visits = [
            makeVisit({ id: 'v1', salespersonId: '', eventId: 'e1' }),
        ];
        const result = filterVendorVisits(visits, events, 'vendor-1');
        expect(result).toHaveLength(1);
    });

    it('excludes visits from test events', () => {
        const events = [makeEvent({ id: 'e1', isTest: true, salespersonIds: ['vendor-1'] })];
        const visits = [makeVisit({ id: 'v1', salespersonId: 'vendor-1', eventId: 'e1' })];
        const result = filterVendorVisits(visits, events, 'vendor-1');
        expect(result).toHaveLength(0);
    });

    it('returns empty if vendor has no visits', () => {
        const events = [makeEvent({ id: 'e1' })];
        const visits = [makeVisit({ id: 'v1', salespersonId: 'other', eventId: 'e1' })];
        const result = filterVendorVisits(visits, events, 'vendor-1');
        expect(result).toHaveLength(0);
    });
});

// ============================================================================
// countVendorVouchers
// ============================================================================

describe('countVendorVouchers', () => {
    it('counts vouchers that belong to vendor visits', () => {
        const events = [makeEvent({ id: 'e1' })];
        const visits = [
            makeVisit({ id: 'v1', eventId: 'e1', salespersonId: 'vendor-1', vouchersGenerated: ['ABC123', 'DEF456'] }),
        ];
        const vouchers = [
            makeVoucher({ code: 'ABC123', eventId: 'e1', visitId: 'v1' }),
            makeVoucher({ code: 'DEF456', eventId: 'e1', visitId: 'v1' }),
        ];
        expect(countVendorVouchers(vouchers, events, visits, 'vendor-1')).toBe(2);
    });

    it('excludes vouchers from test events', () => {
        const events = [makeEvent({ id: 'e1', isTest: true })];
        const visits = [
            makeVisit({ id: 'v1', eventId: 'e1', salespersonId: 'vendor-1', vouchersGenerated: ['ABC123'] }),
        ];
        const vouchers = [makeVoucher({ code: 'ABC123', eventId: 'e1', visitId: 'v1' })];
        expect(countVendorVouchers(vouchers, events, visits, 'vendor-1')).toBe(0);
    });

    it('excludes vouchers not in vouchersGenerated list', () => {
        const events = [makeEvent({ id: 'e1' })];
        const visits = [
            makeVisit({ id: 'v1', eventId: 'e1', salespersonId: 'vendor-1', vouchersGenerated: ['ABC123'] }),
        ];
        const vouchers = [
            makeVoucher({ code: 'ABC123', eventId: 'e1', visitId: 'v1' }),
            makeVoucher({ code: 'ORPHAN', eventId: 'e1', visitId: 'v1' }),
        ];
        expect(countVendorVouchers(vouchers, events, visits, 'vendor-1')).toBe(1);
    });

    it('returns 0 when no vouchers exist', () => {
        const events = [makeEvent({ id: 'e1' })];
        const visits = [makeVisit({ id: 'v1', eventId: 'e1', salespersonId: 'vendor-1' })];
        expect(countVendorVouchers([], events, visits, 'vendor-1')).toBe(0);
    });
});

// ============================================================================
// calculateTemperatureStats
// ============================================================================

describe('calculateTemperatureStats', () => {
    it('counts temperature categories correctly', () => {
        const visits = [
            makeVisit({ temperature: AcademyTemperature.HOT }),
            makeVisit({ temperature: AcademyTemperature.HOT }),
            makeVisit({ temperature: AcademyTemperature.COLD }),
        ];
        const result = calculateTemperatureStats(visits);
        expect(result[AcademyTemperature.HOT]).toBe(2);
        expect(result[AcademyTemperature.COLD]).toBe(1);
        expect(result[AcademyTemperature.WARM]).toBe(0);
    });

    it('falls back to WARM when temperature is undefined', () => {
        const visits = [makeVisit({ temperature: undefined })];
        const result = calculateTemperatureStats(visits);
        expect(result[AcademyTemperature.WARM]).toBe(1);
    });

    it('returns all zeros for empty visits', () => {
        const result = calculateTemperatureStats([]);
        expect(result[AcademyTemperature.HOT]).toBe(0);
        expect(result[AcademyTemperature.WARM]).toBe(0);
        expect(result[AcademyTemperature.COLD]).toBe(0);
    });
});

// ============================================================================
// calculateContactStats
// ============================================================================

describe('calculateContactStats', () => {
    it('counts contact person categories correctly', () => {
        const visits = [
            makeVisit({ contactPerson: ContactPerson.OWNER }),
            makeVisit({ contactPerson: ContactPerson.OWNER }),
            makeVisit({ contactPerson: ContactPerson.TEACHER }),
        ];
        const result = calculateContactStats(visits);
        expect(result[ContactPerson.OWNER]).toBe(2);
        expect(result[ContactPerson.TEACHER]).toBe(1);
        expect(result[ContactPerson.STAFF]).toBe(0);
        expect(result[ContactPerson.NOBODY]).toBe(0);
    });

    it('falls back to NOBODY when contactPerson is undefined', () => {
        const visits = [makeVisit({ contactPerson: undefined })];
        const result = calculateContactStats(visits);
        expect(result[ContactPerson.NOBODY]).toBe(1);
    });

    it('returns all zeros for empty visits', () => {
        const result = calculateContactStats([]);
        expect(result[ContactPerson.OWNER]).toBe(0);
        expect(result[ContactPerson.TEACHER]).toBe(0);
    });
});

// ============================================================================
// calculateAvgVisitMinutes
// ============================================================================

describe('calculateAvgVisitMinutes', () => {
    it('calculates average time correctly', () => {
        const visits = [
            makeVisit({ startedAt: '2026-01-01T10:00:00Z', finishedAt: '2026-01-01T10:30:00Z' }),
            makeVisit({ startedAt: '2026-01-01T11:00:00Z', finishedAt: '2026-01-01T12:00:00Z' }),
        ];
        // (30 + 60) / 2 = 45
        expect(calculateAvgVisitMinutes(visits)).toBe(45);
    });

    it('filters out outliers > 8 hours', () => {
        const visits = [
            makeVisit({ startedAt: '2026-01-01T10:00:00Z', finishedAt: '2026-01-01T10:30:00Z' }),
            makeVisit({ startedAt: '2026-01-01T00:00:00Z', finishedAt: '2026-01-01T20:00:00Z' }), // 20h outlier
        ];
        // Only 30 min visit counts
        expect(calculateAvgVisitMinutes(visits)).toBe(30);
    });

    it('filters out negative durations', () => {
        const visits = [
            makeVisit({ startedAt: '2026-01-01T12:00:00Z', finishedAt: '2026-01-01T10:00:00Z' }), // negative
            makeVisit({ startedAt: '2026-01-01T10:00:00Z', finishedAt: '2026-01-01T11:00:00Z' }),
        ];
        expect(calculateAvgVisitMinutes(visits)).toBe(60);
    });

    it('returns 0 when no valid timed visits', () => {
        const visits = [makeVisit({ startedAt: undefined, finishedAt: undefined })];
        expect(calculateAvgVisitMinutes(visits)).toBe(0);
    });

    it('returns 0 for empty array', () => {
        expect(calculateAvgVisitMinutes([])).toBe(0);
    });
});
