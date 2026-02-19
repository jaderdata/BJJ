import { useQuery } from '@tanstack/react-query';
import { DatabaseService } from '../lib/supabase';

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: () => DatabaseService.getEvents(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useEventAcademies = (eventId: string | null) => {
    return useQuery({
        queryKey: ['event-academies', eventId],
        queryFn: () => eventId ? DatabaseService.getEventAcademies(eventId) : Promise.resolve([]),
        enabled: !!eventId,
    });
};
