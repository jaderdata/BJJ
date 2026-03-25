import React, { useState, useEffect, useCallback } from 'react';
import { Academy, User, Meeting } from '../types';
import { DatabaseService } from '../lib/supabase';
import { supabase } from '../lib/supabase-client';
import { MeetingCalendar } from '../components/meetings/MeetingCalendar';
import { NewMeetingModal } from '../components/meetings/NewMeetingModal';
import { EmailConfirmationModal } from '../components/meetings/EmailConfirmationModal';

interface MeetingsPageProps {
    academies: Academy[];
    currentUser: User;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({ academies, currentUser }) => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [meetingsLoading, setMeetingsLoading] = useState(true);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [emailMeeting, setEmailMeeting] = useState<Meeting | null>(null);
    const [emailMeetingLang, setEmailMeetingLang] = useState<'pt' | 'en'>('pt');

    const loadMeetings = useCallback(async () => {
        setMeetingsLoading(true);
        try {
            const data = await DatabaseService.getMeetings();
            setMeetings(data);
        } catch (err) {
            console.error('[Meetings] Error loading:', err);
        } finally {
            setMeetingsLoading(false);
        }
    }, []);

    useEffect(() => { loadMeetings(); }, [loadMeetings]);

    useEffect(() => {
        const ch = supabase
            .channel('meetings-realtime-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
                loadMeetings();
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [loadMeetings]);

    const handleSaveMeeting = async (instances: Partial<Meeting>[], lang: 'pt' | 'en' = 'pt') => {
        const [first, ...rest] = instances;

        if (first.id) {
            const updated = await DatabaseService.updateMeeting(first.id, first);
            setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
            setShowMeetingModal(false);
            setEditingMeeting(null);
        } else {
            const created = await DatabaseService.createMeeting(first);

            if (rest.length > 0) {
                const recurrenceInstances = await Promise.all(
                    rest.map(inst => DatabaseService.createMeeting({ ...inst, parentMeetingId: created.id }))
                );
                setMeetings(prev =>
                    [...prev, created, ...recurrenceInstances].sort((a, b) =>
                        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                    )
                );
            } else {
                setMeetings(prev =>
                    [...prev, created].sort((a, b) =>
                        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
                    )
                );
            }

            setShowMeetingModal(false);
            setEditingMeeting(null);
            setEmailMeetingLang(created.emailLang ?? lang);
            setEmailMeeting(created);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <MeetingCalendar
                meetings={meetings}
                academies={academies}
                onNewMeeting={() => { setEditingMeeting(null); setShowMeetingModal(true); }}
                onMeetingClick={(m) => { setEditingMeeting(m); setShowMeetingModal(true); }}
                loading={meetingsLoading}
            />

            {showMeetingModal && (
                <NewMeetingModal
                    academies={academies}
                    currentUser={currentUser}
                    editing={editingMeeting}
                    allMeetings={meetings}
                    onSave={handleSaveMeeting}
                    onClose={() => { setShowMeetingModal(false); setEditingMeeting(null); }}
                />
            )}

            {emailMeeting && (
                <EmailConfirmationModal
                    meeting={emailMeeting}
                    academyName={academies.find(a => a.id === emailMeeting.academyId)?.name || ''}
                    initialLang={emailMeetingLang}
                    onClose={() => setEmailMeeting(null)}
                    onSent={(id) => {
                        setMeetings(prev => prev.map(m => m.id === id ? { ...m, emailSent: true } : m));
                        setEmailMeeting(null);
                    }}
                />
            )}
        </div>
    );
};
