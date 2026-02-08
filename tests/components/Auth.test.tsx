import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from '@/components/Auth'
import { mockSupabaseClient } from '@/tests/utils/supabase-test-client'

// Mock do supabase client
vi.mock('@/lib/supabase-client', async () => {
    const { mockSupabaseClient } = await import('@/tests/utils/supabase-test-client')
    return {
        supabase: mockSupabaseClient
    }
})

describe('Auth Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login form by default', () => {
        render(<Auth />)
        expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /verify identity/i })).toBeInTheDocument()
    })

    it('switches to sign up mode', () => {
        render(<Auth />)

        const signUpToggle = screen.getByRole('button', { name: /sign up/i })
        fireEvent.click(signUpToggle)

        expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('submits login form with valid credentials', async () => {
        render(<Auth />)

        const emailInput = screen.getByPlaceholderText(/email address/i)
        const passwordInput = screen.getByPlaceholderText(/password/i)
        const submitButton = screen.getByRole('button', { name: /verify identity/i })

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: null })

        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            })
        })
    })
})
