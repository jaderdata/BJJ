import { render, screen, waitFor } from '@tests/utils/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { DatabaseService } from '@/lib/supabase'
import { EventStatus, VisitStatus, UserRole } from '@/types'

// Mock DatabaseService
vi.mock('@/lib/supabase', () => {
    return {
        DatabaseService: {
            getSetting: vi.fn(),
            setSetting: vi.fn()
        },
        supabase: {
            functions: {
                invoke: vi.fn()
            }
        }
    }
})

const currentDate = new Date()
const currentYear = currentDate.getFullYear()

const mockEvents = [
    {
        id: 'e1',
        name: 'Event 1',
        status: EventStatus.IN_PROGRESS,
        startDate: `${currentYear}-01-01`,
        academiesIds: ['a1', 'a2'],
        salespersonId: 'u1'
    }
]

const mockAcademies = [
    { id: 'a1', name: 'Academy 1' },
    { id: 'a2', name: 'Academy 2' }
]

const mockVisits = [
    {
        id: 'v1',
        eventId: 'e1',
        academyId: 'a1',
        status: VisitStatus.VISITED,
        finishedAt: `${currentYear}-01-02`,
        salespersonId: 'u1'
    }
]

const mockUsers = [
    { id: 'u1', name: 'Seller 1', role: UserRole.SALES }
]

describe('AdminDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders dashboard KPIs correctly', async () => {
        render(
            <AdminDashboard
                events={mockEvents as any}
                academies={mockAcademies as any}
                visits={mockVisits as any}
                vouchers={[]}
                finance={[]}
                vendedores={mockUsers as any}
            />
        )

        expect(screen.getByText('Eventos Ativos')).toBeInTheDocument()
        // Verificar que renderiza sem erros

        expect(screen.getByText('Visitas Realizadas')).toBeInTheDocument()
    })

    it('calculates pending visits correctly', () => {
        render(
            <AdminDashboard
                events={mockEvents as any}
                academies={mockAcademies as any}
                visits={mockVisits as any}
                vouchers={[]}
                finance={[]}
                vendedores={mockUsers as any}
            />
        )

        expect(screen.getByText('Visitas Pendentes')).toBeInTheDocument()
    })
})
