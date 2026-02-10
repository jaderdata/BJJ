import { render, screen, fireEvent, waitFor } from '@tests/utils/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from '@/pages/CustomAuth'
import { mockSupabaseClient } from '@tests/utils/supabase-test-client'

// Mock do supabase client
vi.mock('@/lib/supabase-client', async () => {
    const { mockSupabaseClient } = await import('@tests/utils/supabase-test-client')
    return {
        supabase: mockSupabaseClient
    }
})

describe('Auth Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login form by default', () => {
        render(<Auth onLogin={() => { }} />)
        expect(screen.getByPlaceholderText(/seu e-mail/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/sua senha/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })

    it('switches to request access mode', () => {
        render(<Auth onLogin={() => { }} />)

        const requestAccessToggle = screen.getByRole('button', { name: /não tem acesso\? solicitar aqui/i })
        fireEvent.click(requestAccessToggle)

        expect(screen.getByRole('heading', { name: /solicitar acesso/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /solicitar acesso/i })).toBeInTheDocument()
    })

    it('submits login form with valid credentials', async () => {
        render(<Auth onLogin={() => { }} />)

        const emailInput = screen.getByPlaceholderText(/seu e-mail/i)
        const passwordInput = screen.getByPlaceholderText(/sua senha/i)
        const submitButton = screen.getByRole('button', { name: /entrar/i })

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })

        const mockUser = { id: 'u123', name: 'Test User', email: 'test@example.com', role: 'SALES' }
        mockSupabaseClient.rpc.mockResolvedValueOnce({
            data: { success: true, user: mockUser },
            error: null
        })

        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('auth_login', {
                p_email: 'test@example.com',
                p_password: 'password123'
            })
        })
    })
})
