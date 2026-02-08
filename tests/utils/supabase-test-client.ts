import { vi } from 'vitest'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockRpc = vi.fn()

// Configure chaining defaults
mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockInsert
})

mockSelect.mockReturnValue({
    order: mockOrder,
    eq: mockEq,
    single: mockSingle,
    limit: vi.fn().mockReturnThis()
})

mockInsert.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    single: mockSingle
})

mockUpdate.mockReturnValue({
    eq: mockEq,
    select: vi.fn().mockReturnThis(),
    single: mockSingle
})

mockDelete.mockReturnValue({
    eq: mockEq,
    match: vi.fn().mockReturnThis()
})

mockEq.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    single: mockSingle
})

mockOrder.mockReturnThis()

const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
}

export const mockSupabaseClient = {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
    // expose individual mocks for assertions
    mocks: {
        from: mockFrom,
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        order: mockOrder,
        single: mockSingle,
        rpc: mockRpc,
        auth: mockAuth
    }
}
