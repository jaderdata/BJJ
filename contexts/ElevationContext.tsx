import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ElevationService, ElevationSession } from '../lib/supabase';

interface ElevationContextType {
    isElevated: boolean;
    session: ElevationSession | null;
    requestElevation: (password: string, reason?: string) => Promise<{ success: boolean; message: string }>;
    revokeElevation: () => Promise<void>;
    checkElevation: () => Promise<void>;
    requireElevation: () => Promise<boolean>;
}

const ElevationContext = createContext<ElevationContextType | undefined>(undefined);

export const useElevation = () => {
    const context = useContext(ElevationContext);
    if (!context) {
        throw new Error('useElevation must be used within ElevationProvider');
    }
    return context;
};

interface ElevationProviderProps {
    children: ReactNode;
    userId: string | null;
}

export const ElevationProvider: React.FC<ElevationProviderProps> = ({ children, userId }) => {
    const [session, setSession] = useState<ElevationSession | null>(null);
    const [isElevated, setIsElevated] = useState(false);

    // Verifica elevação ao montar e periodicamente
    useEffect(() => {
        if (!userId) {
            setIsElevated(false);
            setSession(null);
            return;
        }

        checkElevation();

        // Verificar a cada 30 segundos
        const interval = setInterval(checkElevation, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    const checkElevation = async () => {
        if (!userId) return;

        try {
            const elevationSession = await ElevationService.checkElevation(userId);
            setSession(elevationSession);
            setIsElevated(elevationSession.elevated);

            // Se expirou, limpar
            if (!elevationSession.elevated && isElevated) {
                console.log('🔒 Sessão administrativa expirou');
            }
        } catch (error) {
            console.error('Error checking elevation:', error);
            setIsElevated(false);
            setSession(null);
        }
    };

    const requestElevation = async (password: string, reason?: string): Promise<{ success: boolean; message: string }> => {
        if (!userId) {
            return { success: false, message: 'Usuário não autenticado' };
        }

        try {
            const result = await ElevationService.requestElevation(userId, password, reason);

            if (result.success && result.session) {
                setSession(result.session);
                setIsElevated(true);
                console.log('🔓 Privilégios elevados com sucesso');
            }

            return { success: result.success, message: result.message };
        } catch (error: any) {
            console.error('Error requesting elevation:', error);
            return { success: false, message: error.message || 'Erro ao elevar privilégios' };
        }
    };

    const revokeElevation = async () => {
        if (!userId) return;

        try {
            await ElevationService.revokeElevation(userId);
            setIsElevated(false);
            setSession(null);
            console.log('🔒 Privilégios revogados');
        } catch (error) {
            console.error('Error revoking elevation:', error);
        }
    };

    const requireElevation = async (): Promise<boolean> => {
        await checkElevation();
        return isElevated;
    };

    return (
        <ElevationContext.Provider
            value={{
                isElevated,
                session,
                requestElevation,
                revokeElevation,
                checkElevation,
                requireElevation
            }}
        >
            {children}
        </ElevationContext.Provider>
    );
};
