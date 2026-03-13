import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../lib/supabase';

export const useMeetings = (fromDate?: string, toDate?: string) => {
    return useQuery({
        queryKey: ['meetings', fromDate, toDate],
        queryFn: () => DatabaseService.getMeetings(fromDate, toDate),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};
