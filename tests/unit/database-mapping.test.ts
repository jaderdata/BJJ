import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseService } from '@/lib/supabase';
import { mockSupabaseClient } from '@tests/utils/supabase-test-client';
import { VisitStatus } from '@/types';

// Mock do supabase client
vi.mock('@/lib/supabase-client', async () => {
    const { mockSupabaseClient } = await import('@tests/utils/supabase-test-client');
    return {
        supabase: mockSupabaseClient,
    };
});

describe('DatabaseService — Data Mapping', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ============================================================================
    // getEvents mapping
    // ============================================================================

    describe('getEvents', () => {
        it('maps snake_case to camelCase correctly', async () => {
            const rawData = [
                {
                    id: 'e1',
                    name: 'PBJJF Orlando',
                    event_salespersons: [{ salesperson_id: 'sp-1' }, { salesperson_id: 'sp-2' }],
                    event_date: '2026-01-01',
                    start_date: '2026-01-01',
                    end_date: '2026-01-02',
                    photo_url: 'https://example.com/photo.jpg',
                    is_test: false,
                    event_academies: [
                        { academy_id: 'a1', is_active: true },
                        { academy_id: 'a2', is_active: false },
                    ],
                },
            ];

            mockSupabaseClient.mocks.order.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getEvents();

            expect(result[0].salespersonIds).toEqual(['sp-1', 'sp-2']);
            expect(result[0].startDate).toBe('2026-01-01');
            expect(result[0].endDate).toBe('2026-01-02');
            expect(result[0].photoUrl).toBe('https://example.com/photo.jpg');
            expect(result[0].isTest).toBe(false);
        });

        it('filters inactive event_academies from academiesIds', async () => {
            const rawData = [
                {
                    id: 'e1',
                    name: 'Event',
                    event_academies: [
                        { academy_id: 'a1', is_active: true },
                        { academy_id: 'a2', is_active: false },
                        { academy_id: 'a3', is_active: true },
                    ],
                },
            ];

            mockSupabaseClient.mocks.order.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getEvents();
            expect(result[0].academiesIds).toEqual(['a1', 'a3']);
        });

        it('returns empty academiesIds when no event_academies', async () => {
            const rawData = [{ id: 'e1', name: 'Event', event_academies: null }];

            mockSupabaseClient.mocks.order.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getEvents();
            expect(result[0].academiesIds).toEqual([]);
        });
    });

    // ============================================================================
    // getVisits mapping
    // ============================================================================

    describe('getVisits', () => {
        it('maps all snake_case fields to camelCase', async () => {
            const rawData = [
                {
                    id: 'v1',
                    event_id: 'e1',
                    academy_id: 'a1',
                    salesperson_id: 'sp-1',
                    status: VisitStatus.VISITED,
                    started_at: '2026-01-01T10:00:00Z',
                    finished_at: '2026-01-01T11:00:00Z',
                    summary: 'Good visit',
                    notes: 'Some notes',
                    contact_person: 'Dono',
                    vouchers_generated: ['ABC123'],
                    photos: ['photo1.jpg'],
                    left_banner: true,
                    left_flyers: false,
                },
            ];

            mockSupabaseClient.mocks.select.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getVisits();

            expect(result[0].eventId).toBe('e1');
            expect(result[0].academyId).toBe('a1');
            expect(result[0].salespersonId).toBe('sp-1');
            expect(result[0].startedAt).toBe('2026-01-01T10:00:00Z');
            expect(result[0].finishedAt).toBe('2026-01-01T11:00:00Z');
            expect(result[0].summary).toBe('Good visit');
            expect(result[0].contactPerson).toBe('Dono');
            expect(result[0].vouchersGenerated).toEqual(['ABC123']);
            expect(result[0].photos).toEqual(['photo1.jpg']);
            expect(result[0].leftBanner).toBe(true);
            expect(result[0].leftFlyers).toBe(false);
        });

        it('defaults photos to empty array when null', async () => {
            const rawData = [
                {
                    id: 'v1',
                    event_id: 'e1',
                    academy_id: 'a1',
                    salesperson_id: 'sp-1',
                    status: VisitStatus.PENDING,
                    photos: null,
                },
            ];

            mockSupabaseClient.mocks.select.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getVisits();
            expect(result[0].photos).toEqual([]);
        });

        it('uses summary field, falling back to notes', async () => {
            const rawData = [
                {
                    id: 'v1',
                    event_id: 'e1',
                    academy_id: 'a1',
                    salesperson_id: 'sp-1',
                    status: VisitStatus.VISITED,
                    summary: null,
                    notes: 'Fallback notes',
                },
            ];

            mockSupabaseClient.mocks.select.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getVisits();
            expect(result[0].summary).toBe('Fallback notes');
        });
    });

    // ============================================================================
    // getFinance mapping
    // ============================================================================

    describe('getFinance', () => {
        it('maps finance fields correctly', async () => {
            const rawData = [
                {
                    id: 'f1',
                    event_id: 'e1',
                    salesperson_id: 'sp-1',
                    amount: 500,
                    status: 'Pendente',
                    updated_at: '2026-01-15T00:00:00Z',
                    created_at: '2026-01-01T00:00:00Z',
                    observation: 'First payment',
                },
            ];

            mockSupabaseClient.mocks.order.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getFinance();
            expect(result[0].eventId).toBe('e1');
            expect(result[0].salespersonId).toBe('sp-1');
            expect(result[0].updatedAt).toBe('2026-01-15T00:00:00Z');
            expect(result[0].observation).toBe('First payment');
        });

        it('falls back to created_at when updated_at is null', async () => {
            const rawData = [
                {
                    id: 'f1',
                    event_id: 'e1',
                    salesperson_id: 'sp-1',
                    amount: 100,
                    status: 'Pago',
                    updated_at: null,
                    created_at: '2026-01-01T00:00:00Z',
                    observation: null,
                },
            ];

            mockSupabaseClient.mocks.order.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getFinance();
            expect(result[0].updatedAt).toBe('2026-01-01T00:00:00Z');
        });
    });

    // ============================================================================
    // getVouchers mapping
    // ============================================================================

    describe('getVouchers', () => {
        it('maps voucher fields correctly', async () => {
            const rawData = [
                {
                    code: 'ABC123',
                    event_id: 'e1',
                    academy_id: 'a1',
                    visit_id: 'v1',
                    created_at: '2026-01-01T00:00:00Z',
                },
            ];

            mockSupabaseClient.mocks.select.mockResolvedValueOnce({
                data: rawData,
                error: null,
            });

            const result = await DatabaseService.getVouchers();
            expect(result[0].eventId).toBe('e1');
            expect(result[0].academyId).toBe('a1');
            expect(result[0].visitId).toBe('v1');
            expect(result[0].createdAt).toBe('2026-01-01T00:00:00Z');
        });
    });
});
