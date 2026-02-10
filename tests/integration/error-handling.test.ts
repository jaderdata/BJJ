import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatabaseService } from '@/lib/supabase'
import { mockSupabaseClient } from '@tests/utils/supabase-test-client'

// Mock do supabase client
vi.mock('@/lib/supabase-client', async () => {
    const { mockSupabaseClient } = await import('@tests/utils/supabase-test-client')
    return {
        supabase: mockSupabaseClient
    }
})

describe('Database Error Handling (RLS & Constraints)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Configurar chain para insert
        mockSupabaseClient.mocks.insert.mockReturnValue({
            select: vi.fn().mockReturnValue({
                single: mockSupabaseClient.mocks.single
            })
        })
    })

    it('should handle RLS violation error (42501)', async () => {
        const error = { code: '42501', message: 'new row violates row-level security policy' }
        mockSupabaseClient.mocks.single.mockResolvedValueOnce({ data: null, error })

        // Simular criação de academia sem permissão (ex: anon trying to create)
        await expect(DatabaseService.createAcademy({ name: 'Forbidden Academy' }))
            .rejects.toEqual(error)
    })

    it('should handle Unique Constraint violation error (23505)', async () => {
        const error = { code: '23505', message: 'duplicate key value violates unique constraint' }
        mockSupabaseClient.mocks.single.mockResolvedValueOnce({ data: null, error })

        // Simular duplicação
        await expect(DatabaseService.createAcademy({ name: 'Duplicate Academy' }))
            .rejects.toEqual(error)
    })

    it('should handle generic database error', async () => {
        const error = { message: 'Connection timed out' }
        mockSupabaseClient.mocks.single.mockResolvedValueOnce({ data: null, error })

        await expect(DatabaseService.createAcademy({ name: 'Error Academy' }))
            .rejects.toEqual(error)
    })
})
