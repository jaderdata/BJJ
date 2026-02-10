import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '@/lib/supabase'
import { mockSupabaseClient } from '@tests/utils/supabase-test-client'

// Mock do supabase client
vi.mock('@/lib/supabase-client', async () => {
    const { mockSupabaseClient } = await import('@tests/utils/supabase-test-client')
    return {
        supabase: mockSupabaseClient
    }
})

describe('AuthService Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset chains
        mockSupabaseClient.mocks.rpc.mockReset()
    })

    it('login should call auth_login rpc', async () => {
        const credentials = { email: 'test@example.com', password: 'password' }
        const mockResponse = { success: true, user: { id: '123' } }

        mockSupabaseClient.mocks.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

        const result = await AuthService.login(credentials.email, credentials.password)

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('auth_login', {
            p_email: credentials.email,
            p_password: credentials.password
        })
        expect(result).toEqual(mockResponse)
    })

    it('requestAccess should call auth_request_access rpc', async () => {
        const email = 'test@example.com'
        const mockResponse = { success: true }

        mockSupabaseClient.mocks.rpc.mockResolvedValueOnce({ data: mockResponse, error: null })

        const result = await AuthService.requestAccess(email)

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('auth_request_access', {
            p_email: email
        })
        expect(result).toEqual(mockResponse)
    })
})
