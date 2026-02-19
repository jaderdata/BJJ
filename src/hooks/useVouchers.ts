import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../lib/supabase';

export const useVouchers = () => {
    return useQuery({
        queryKey: ['vouchers'],
        queryFn: () => DatabaseService.getVouchers(),
        staleTime: 1000 * 60 * 10, // 10 minutes (less frequent)
    });
};
