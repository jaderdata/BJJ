import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../lib/supabase';

export const useAcademies = () => {
    return useQuery({
        queryKey: ['academies'],
        queryFn: () => DatabaseService.getAcademies(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
