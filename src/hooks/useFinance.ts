import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../lib/supabase';

export const useFinance = () => {
    return useQuery({
        queryKey: ['finance'],
        queryFn: () => DatabaseService.getFinance(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
