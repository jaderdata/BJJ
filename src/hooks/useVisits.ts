import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../lib/supabase';

export const useVisits = () => {
    return useQuery({
        queryKey: ['visits'],
        queryFn: () => DatabaseService.getVisits(),
        staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates for visits)
    });
};
