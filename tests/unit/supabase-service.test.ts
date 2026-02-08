import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatabaseService } from '@/lib/supabase'
import { mockSupabaseClient } from '@/tests/utils/supabase-test-client'

// Mock do supabase client
vi.mock('@/lib/supabase-client', async () => {
    const { mockSupabaseClient } = await import('@/tests/utils/supabase-test-client')
    return {
        supabase: mockSupabaseClient
    }
})

describe('DatabaseService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getAcademies should fetch academies ordered by created_at', async () => {
        const mockData = [{ id: '1', name: 'Academy 1' }]

        // Configurar retorno do mock
        mockSupabaseClient.mocks.order.mockResolvedValueOnce({ data: mockData, error: null })

        const result = await DatabaseService.getAcademies()

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('academies')
        expect(mockSupabaseClient.mocks.select).toHaveBeenCalledWith('*')
        expect(mockSupabaseClient.mocks.order).toHaveBeenCalledWith('created_at', { ascending: false })
        expect(result).toEqual(mockData)
    })

    it('createAcademy should insert a new academy', async () => {
        const newAcademy = { name: 'New Academy' }
        const createdAcademy = { id: '1', ...newAcademy }

        // Configurar retorno do mock
        mockSupabaseClient.mocks.single.mockResolvedValueOnce({ data: createdAcademy, error: null })

        await DatabaseService.createAcademy(newAcademy)

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('academies')
        expect(mockSupabaseClient.mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New Academy'
        }))
    })
})
