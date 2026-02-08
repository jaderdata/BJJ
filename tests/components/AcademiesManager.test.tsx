import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AcademiesManager } from '@/components/AcademiesManager'
import { DatabaseService } from '@/lib/supabase'
import { UserRole } from '@/types'

// Mock do módulo inteiro do supabase
vi.mock('@/lib/supabase', () => {
    return {
        DatabaseService: {
            createAcademy: vi.fn(),
            updateAcademy: vi.fn(),
            deleteAcademy: vi.fn(),
            getSetting: vi.fn()
        },
        // Mock vazio para o cliente supabase se for importado
        supabase: {}
    }
})

const mockAcademies = [
    { id: '1', name: 'Gracie Barra', city: 'Rio de Janeiro', state: 'RJ', address: 'Rua A' },
    { id: '2', name: 'Alliance', city: 'São Paulo', state: 'SP', address: 'Rua B' }
]

const adminUser = {
    id: 'user1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    name: 'Admin User'
}

describe('AcademiesManager Integration', () => {
    const setAcademiesSpy = vi.fn()
    const notifyUserSpy = vi.fn()
    const NO_EVENTS: any[] = []

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render the list of provided academies', () => {
        render(
            <AcademiesManager
                academies={mockAcademies}
                setAcademies={setAcademiesSpy}
                currentUser={adminUser}
                notifyUser={notifyUserSpy}
                events={NO_EVENTS}
            />
        )

        expect(screen.getByText('Gracie Barra')).toBeInTheDocument()
        expect(screen.getByText('Alliance')).toBeInTheDocument()
    })

    it('should open the modal when "Nova Academia" is clicked', () => {
        render(
            <AcademiesManager
                academies={mockAcademies}
                setAcademies={setAcademiesSpy}
                currentUser={adminUser}
                notifyUser={notifyUserSpy}
                events={NO_EVENTS}
            />
        )

        const addButton = screen.getByRole('button', { name: /nova academia/i })
        fireEvent.click(addButton)

        expect(screen.getByRole('heading', { name: 'Nova Academia' })).toBeInTheDocument()
    })

    it('should call DatabaseService.createAcademy when form is submitted', async () => {
        const createdAcademy = { id: '3', name: 'Checkmat', city: 'Santos', state: 'SP', address: 'Rua C' }
        vi.mocked(DatabaseService.createAcademy).mockResolvedValueOnce(createdAcademy)

        render(
            <AcademiesManager
                academies={mockAcademies}
                setAcademies={setAcademiesSpy}
                currentUser={adminUser}
                notifyUser={notifyUserSpy}
                events={NO_EVENTS}
            />
        )

        // Open modal
        fireEvent.click(screen.getByRole('button', { name: /nova academia/i }))

        // Fill form
        const nameInput = screen.getByPlaceholderText('Nome da Academia')
        fireEvent.change(nameInput, { target: { value: 'Checkmat' } })

        fireEvent.change(screen.getByPlaceholderText('Endereço completo'), { target: { value: 'Rua C' } })
        fireEvent.change(screen.getByPlaceholderText('Ex: Orlando'), { target: { value: 'Santos' } })
        fireEvent.change(screen.getByPlaceholderText('Ex: FL'), { target: { value: 'SP' } })

        // Submit
        const saveBtn = screen.getByRole('button', { name: /criar academia/i })
        fireEvent.click(saveBtn)

        await waitFor(() => {
            expect(DatabaseService.createAcademy).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Checkmat',
                city: 'Santos',
                state: 'SP'
            }))
            expect(setAcademiesSpy).toHaveBeenCalled()
        })
    })

    it('should open edit modal and update academy', async () => {
        const updatedAcademy = { ...mockAcademies[0], name: 'Gracie Barra Updated', city: 'Niterói' }
        vi.mocked(DatabaseService.updateAcademy).mockResolvedValueOnce(updatedAcademy)

        render(
            <AcademiesManager
                academies={mockAcademies}
                setAcademies={setAcademiesSpy}
                currentUser={adminUser}
                notifyUser={notifyUserSpy}
                events={NO_EVENTS}
            />
        )

        const editButtons = screen.getAllByRole('button', { name: /editar academia/i })
        fireEvent.click(editButtons[0])

        fireEvent.change(screen.getByPlaceholderText('Nome da Academia'), { target: { value: 'Gracie Barra Updated' } })

        const saveBtn = screen.getByRole('button', { name: /salvar alterações/i })
        fireEvent.click(saveBtn)

        await waitFor(() => {
            expect(DatabaseService.updateAcademy).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Gracie Barra Updated' }))
        })
    })

    it('should delete an academy after confirmation', async () => {
        vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
        vi.mocked(DatabaseService.deleteAcademy).mockResolvedValueOnce()

        render(
            <AcademiesManager
                academies={mockAcademies}
                setAcademies={setAcademiesSpy}
                currentUser={adminUser}
                notifyUser={notifyUserSpy}
                events={NO_EVENTS}
            />
        )

        const deleteButtons = screen.getAllByRole('button', { name: /excluir academia/i })
        fireEvent.click(deleteButtons[1])

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled()
            expect(DatabaseService.deleteAcademy).toHaveBeenCalledWith('2')
        })
    })

    it('should show alert when creation fails', async () => {
        const error = new Error('Database connection failed')
        vi.mocked(DatabaseService.createAcademy).mockRejectedValueOnce(error)
        vi.spyOn(window, 'alert').mockImplementation(() => { })

        render(
            <AcademiesManager
                academies={mockAcademies}
                setAcademies={setAcademiesSpy}
                currentUser={adminUser}
                notifyUser={notifyUserSpy}
                events={NO_EVENTS}
            />
        )

        fireEvent.click(screen.getByRole('button', { name: /nova academia/i }))

        fireEvent.change(screen.getByPlaceholderText('Nome da Academia'), { target: { value: 'Error Academy' } })
        fireEvent.change(screen.getByPlaceholderText('Endereço completo'), { target: { value: 'Error St' } })
        fireEvent.change(screen.getByPlaceholderText('Ex: Orlando'), { target: { value: 'Error City' } })
        fireEvent.change(screen.getByPlaceholderText('Ex: FL'), { target: { value: 'ER' } })

        const saveBtn = screen.getByRole('button', { name: /criar academia/i })
        fireEvent.click(saveBtn)

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar academia'))
        })
    })
})
