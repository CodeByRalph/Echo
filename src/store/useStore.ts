import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMinutes } from 'date-fns';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Category, Household, Reminder, Stream, UserSettings } from '../types';
import { computeNextFireAt } from '../utils/recurrence';

interface AppState {
    reminders: Reminder[];
    categories: Category[];
    settings: UserSettings;
    isPro: boolean;
    userId: string | null;
    activity: Record<string, number>;

    // Actions
    hydrate: () => Promise<void>;
    signOut: () => Promise<void>;
    resetState: () => void;

    addReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
    updateReminder: (id: string, updates: Partial<Reminder>) => void;
    deleteReminder: (id: string) => void;

    addCategory: (name: string, color: string, icon?: string) => void;
    togglePro: () => void;

    completeReminder: (id: string) => void;
    snoozeReminder: (id: string, minutes: number) => void;

    updateSettings: (updates: Partial<UserSettings>) => void;

    // Community Streams
    publicStreams: Stream[];
    fetchPublicStreams: () => Promise<void>;
    createStream: (title: string, description: string, items: { title: string, recurrence_rule: any, day_offset: number, time_of_day?: string }[]) => Promise<void>;
    subscribeToStream: (streamId: string) => Promise<void>;

    // Family Loop
    currentHousehold: Household | null;
    createHousehold: (name: string) => Promise<void>;
    joinHousehold: (inviteCode: string) => Promise<void>; // Mock
    fetchHouseholdMembers: () => Promise<void>;
    assignReminder: (reminderId: string, userId: string) => void;
    nagMember: (reminderId: string) => void;
    leaveHousehold: () => Promise<void>;
}

// Simple UUID v4 generator for Supabase compatibility
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            reminders: [],
            categories: [
                { id: 'default-work', name: 'Work', color: Colors.dark.primary, icon: 'briefcase', isDefault: true },
                { id: 'default-personal', name: 'Personal', color: Colors.dark.accent, icon: 'person', isDefault: true },
                { id: 'default-misc', name: 'Misc', color: Colors.dark.textSecondary, icon: 'layers', isDefault: true },
            ],
            isPro: false,
            userId: null,
            activity: {},
            settings: {
                snooze_presets_mins: [10, 60, 180],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                notifications_enabled: true,
            },

            hydrate: async () => {
                try {
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError) throw userError;

                    if (!user) {
                        set({ userId: null, reminders: [], activity: {}, currentHousehold: null });
                        return;
                    }

                    // Fetch Data from Supabase (RLS filters by user_id automatically)
                    const { data: reminders, error: remindersError } = await supabase.from('reminders').select('*').is('deleted_at', null);
                    if (remindersError) console.error('Reminders fetch error:', remindersError);

                    const { data: categories, error: categoriesError } = await supabase.from('categories').select('*');
                    if (categoriesError) console.error('Categories fetch error:', categoriesError);

                    const { data: activity, error: activityError } = await supabase.from('activity').select('*');
                    if (activityError) console.error('Activity fetch error:', activityError);

                    // Fetch Household
                    let currentHousehold = null;
                    const { data: membership } = await supabase.from('household_members').select('household_id').eq('user_id', user.id).single();
                    if (membership) {
                        const { data: household } = await supabase.from('households').select('*').eq('id', membership.household_id).single();
                        if (household) {
                            currentHousehold = household;
                            // Fetch members
                            const { data: members } = await supabase.from('household_members').select('*').eq('household_id', household.id);
                            currentHousehold.members = members || [];
                        }
                    }

                    set((state) => ({
                        userId: user.id,
                        // Keep default cats + DB cats
                        categories: [
                            ...state.categories.filter(c => c.isDefault),
                            ...(categories || []).map(c => ({ ...c, isDefault: false } as Category))
                        ].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i),

                        reminders: reminders ? reminders as Reminder[] : [],

                        activity: (activity || []).reduce((acc: any, curr: any) => {
                            acc[curr.date_key] = curr.count;
                            return acc;
                        }, {}),

                        currentHousehold
                    }));
                } catch (e) {
                    console.error('Hydration Action Failed:', e);
                }
            },

            resetState: () => {
                set({ userId: null, reminders: [], activity: {}, currentHousehold: null });
            },

            signOut: async () => {
                await supabase.auth.signOut();
                get().resetState();
            },

            addCategory: (name, color, icon) => set((state) => {
                if (!state.userId) return {}; // Guard: must be logged in

                const newCategory: Category = {
                    id: generateId(),
                    name,
                    color,
                    icon,
                };

                // Async DB Insert
                supabase.from('categories').insert({
                    id: newCategory.id,
                    user_id: state.userId,
                    name,
                    color,
                    icon,
                    is_default: false
                }).then(({ error }) => {
                    if (error) console.error('Error adding category:', error);
                });

                return { categories: [...state.categories, newCategory] };
            }),

            togglePro: () => set((state) => ({ isPro: !state.isPro })),

            addReminder: (reminderData) => set((state) => {
                if (!state.userId) return {}; // Guard

                const now = new Date().toISOString();
                const newReminder: Reminder = {
                    id: generateId(),
                    ...reminderData,
                    created_at: now,
                    updated_at: now,
                    version: 1,
                    last_action: 'create',
                    category_id: reminderData.category_id,
                    snooze_count: 0
                };

                // Async DB Insert
                supabase.from('reminders').insert({
                    ...newReminder,
                    user_id: state.userId
                }).then(({ error }) => {
                    if (error) console.error('Error adding reminder:', error);
                });

                return { reminders: [...state.reminders, newReminder] };
            }),

            updateReminder: (id, updates) => set((state) => {
                const updated_at = new Date().toISOString();

                // Async DB Update
                supabase.from('reminders').update({ ...updates, updated_at }).eq('id', id).then(({ error }) => {
                    if (error) console.error('Error updating reminder:', error);
                });

                return {
                    reminders: state.reminders.map((r) =>
                        r.id === id
                            ? { ...r, ...updates, updated_at, version: r.version + 1 }
                            : r
                    ),
                };
            }),

            deleteReminder: (id) => set((state) => {
                const now = new Date().toISOString();

                // Async DB Soft Delete
                supabase.from('reminders').update({ deleted_at: now, updated_at: now }).eq('id', id).then(({ error }) => {
                    if (error) console.error('Error deleting reminder:', error);
                });

                return {
                    reminders: state.reminders.map((r) =>
                        r.id === id
                            ? { ...r, deleted_at: now, updated_at: now, version: r.version + 1 }
                            : r
                    ),
                };
            }),

            completeReminder: (id) => set((state) => {
                console.log('Store: completeReminder called', { id });
                const reminder = state.reminders.find((r) => r.id === id);
                if (!reminder || !state.userId) {
                    console.log('Store: No reminder found or no userId', { hasReminder: !!reminder, hasUserId: !!state.userId });
                    return {};
                }
                console.log('Store: Found reminder', { title: reminder.title, status: reminder.status, recurrence: reminder.recurrence.type });

                const now = new Date();
                const todayKey = now.toISOString().split('T')[0];
                const currentCount = state.activity[todayKey] || 0;
                const newActivity = { ...state.activity, [todayKey]: currentCount + 1 };
                const nowISO = now.toISOString();

                // DB Activity Upsert
                supabase.from('activity').upsert({ date_key: todayKey, count: currentCount + 1, user_id: state.userId })
                    .then(({ error }) => { if (error) console.error("Activity error", error); });

                let updates: Partial<Reminder> = {};
                let nextFire = reminder.next_fire_at;

                // Handle Recurrence
                if (reminder.recurrence.type !== 'none') {
                    nextFire = computeNextFireAt(reminder.recurrence, reminder.due_at, nowISO);
                    console.log('Store: Recurring task - updating next_fire_at', {
                        oldTime: reminder.next_fire_at,
                        newTime: nextFire
                    });
                    updates = {
                        status: 'active',
                        next_fire_at: nextFire,
                        due_at: nextFire,
                        last_action: 'done',
                        updated_at: nowISO,
                    };
                } else {
                    console.log('Store: One-time task - marking as done');
                    updates = {
                        status: 'done',
                        last_action: 'done',
                        updated_at: nowISO,
                    };
                }

                // DB Update
                supabase.from('reminders').update(updates).eq('id', id).then(({ error }) => {
                    if (error) console.error("Complete error", error);
                });

                return {
                    activity: newActivity,
                    reminders: state.reminders.map((r) =>
                        r.id === id
                            ? { ...r, ...updates, version: r.version + 1 }
                            : r
                    )
                };
            }),

            snoozeReminder: (id, minutes) => set((state) => {
                const now = new Date();
                const nextFire = addMinutes(now, minutes).toISOString();
                const updates = {
                    next_fire_at: nextFire,
                    last_action: 'snooze' as const,
                    updated_at: now.toISOString(),
                    snooze_count: (state.reminders.find(r => r.id === id)?.snooze_count || 0) + 1,
                };

                // DB Update
                supabase.from('reminders').update(updates).eq('id', id).then(({ error }) => {
                    if (error) console.error("Snooze error", error);
                });

                return {
                    reminders: state.reminders.map((r) =>
                        r.id === id
                            ? { ...r, ...updates, version: r.version + 1 }
                            : r
                    )
                };
            }),

            updateSettings: (updates) => set((state) => ({
                settings: { ...state.settings, ...updates }
            })),

            // Community Streams Actions
            publicStreams: [],

            fetchPublicStreams: async () => {
                const { data, error } = await supabase
                    .from('streams')
                    .select('*, items:stream_items(*)')
                    .eq('is_public', true)
                    .order('likes_count', { ascending: false });

                if (error || !data || data.length === 0) {
                    console.log('No streams found in DB or error, using mock data');
                    const { MOCK_STREAMS } = require('../data/mockStreams');
                    set({ publicStreams: MOCK_STREAMS });
                    return;
                }

                set({ publicStreams: data as any[] });
            },

            createStream: async (title, description, items) => {
                const state = get();
                if (!state.userId) return;

                const streamId = generateId();
                const now = new Date().toISOString();

                // 1. Create Stream
                const { error: streamError } = await supabase.from('streams').insert({
                    id: streamId,
                    creator_id: state.userId,
                    title,
                    description,
                    is_public: true,
                    created_at: now,
                    updated_at: now
                });

                if (streamError) {
                    console.error('Error creating stream:', streamError);
                    return;
                }

                // 2. Create Items
                if (items.length > 0) {
                    const streamItems = items.map(item => ({
                        id: generateId(),
                        stream_id: streamId,
                        title: item.title,
                        recurrence_rule: item.recurrence_rule, // JSONB conversion handled by Supabase
                        day_offset: item.day_offset,
                        time_of_day: item.time_of_day
                    }));

                    const { error: itemsError } = await supabase.from('stream_items').insert(streamItems);
                    if (itemsError) console.error('Error creating stream items:', itemsError);
                }

                // Refresh
                await state.fetchPublicStreams();
            },

            subscribeToStream: async (streamId) => {
                const state = get();
                if (!state.userId) return;

                // Fetch stream details if not in list
                let stream = state.publicStreams.find(s => s.id === streamId);
                if (!stream) {
                    // fetch... for now assume it's in the list or handle later
                    console.log('Stream not found in cache');
                    return;
                }

                // Create subscription record
                await supabase.from('stream_subscriptions').insert({
                    user_id: state.userId,
                    stream_id: streamId
                });

                // Import Reminders!
                const now = new Date(); // Start "Day 0" today
                const newReminders: Reminder[] = [];

                (stream.items || []).forEach(item => {
                    // Calculate start date based on day_offset
                    const startDate = new Date(now);
                    startDate.setDate(startDate.getDate() + item.day_offset);

                    // Set time if present
                    if (item.time_of_day) {
                        const [hours, mins] = item.time_of_day.split(':').map(Number);
                        startDate.setHours(hours, mins, 0, 0);
                    }

                    const newId = generateId();
                    const reminder: Reminder = {
                        id: newId,
                        user_id: state.userId!,
                        title: item.title,
                        status: 'active',
                        due_at: startDate.toISOString(),
                        next_fire_at: startDate.toISOString(),
                        recurrence: item.recurrence_rule, // Copy rule
                        created_at: now.toISOString(),
                        updated_at: now.toISOString(),
                        version: 1,
                        last_action: 'create',
                        snooze_count: 0
                    };

                    newReminders.push(reminder);
                });

                // Bulk insert reminders
                // Note: Supabase insert can take an array
                const { error } = await supabase.from('reminders').insert(newReminders);
                if (error) console.error('Error importing stream reminders:', error);

                set(s => ({
                    reminders: [...s.reminders, ...newReminders]
                }));
            },

            // Family Loop Actions
            currentHousehold: null,

            createHousehold: async (name) => {
                const state = get();
                if (!state.userId) return;

                const now = new Date().toISOString();

                // Call secure RPC
                const { data, error } = await supabase.rpc('create_household', { name_input: name });

                if (error) {
                    console.error('RPC Error creating household:', error);
                    Alert.alert("Error", "Network error creating household.");
                    return;
                }

                if (!data.success) {
                    Alert.alert("Failed", data.message || "Could not create household.");
                    return;
                }

                set({
                    currentHousehold: {
                        id: data.household_id,
                        name,
                        created_by: state.userId!,
                        created_at: now,
                        members: [{
                            household_id: data.household_id,
                            user_id: state.userId!,
                            role: 'admin',
                            joined_at: now,
                            profile: { email: 'me@example.com' } // Mock until refresh
                        }],
                        invite_code: data.invite_code
                    }
                });
            },

            joinHousehold: async (inviteCode) => {
                const state = get();
                if (!state.userId) return;

                // Call secure RPC
                const { data, error } = await supabase.rpc('join_household', { invite_code_input: inviteCode });

                if (error) {
                    console.error('RPC Error:', error);
                    Alert.alert("Error", "Network error joining household.");
                    throw error; // Throw so UI knows it failed
                }

                if (!data.success) {
                    Alert.alert("Failed", data.message || "Could not join household.");
                    throw new Error(data.message);
                }

                // Success
                // Fetch household details to update local state immediately
                const { data: household } = await supabase.from('households').select('*').eq('id', data.household_id).single();

                if (household) {
                    set({
                        currentHousehold: {
                            ...household,
                            members: []
                        }
                    });
                    await state.fetchHouseholdMembers();
                }
            },

            leaveHousehold: async () => {
                const state = get();
                if (!state.userId || !state.currentHousehold) return;

                // Delete membership
                const { error } = await supabase.from('household_members')
                    .delete()
                    .eq('household_id', state.currentHousehold.id)
                    .eq('user_id', state.userId);

                if (error) {
                    console.error('Error leaving household:', error);
                    Alert.alert("Error", "Failed to leave household.");
                    return;
                }

                // Clear local state
                set({ currentHousehold: null });
            },

            fetchHouseholdMembers: async () => {
                // Fetch members for current household
                const state = get();
                if (!state.currentHousehold) return;

                const { data, error } = await supabase
                    .from('household_members')
                    .select('*, profiles:user_id(email, full_name, avatar_url)') // Now relying on public.profiles
                    .eq('household_id', state.currentHousehold.id);

                if (error) {
                    console.error('Error fetching members', error);
                    return;
                }

                // Update state
                set(s => ({
                    currentHousehold: s.currentHousehold ? {
                        ...s.currentHousehold,
                        members: data as any[]
                    } : null
                }));
            },

            assignReminder: (reminderId, userId) => {
                set(state => {
                    // Optimistic update
                    const updated = state.reminders.map(r => r.id === reminderId ? { ...r, assignee_id: userId, household_id: state.currentHousehold?.id } : r);

                    // DB Update
                    supabase.from('reminders').update({ assignee_id: userId, household_id: state.currentHousehold?.id }).eq('id', reminderId).then(({ error }) => {
                        if (error) console.error("Error assigning reminder:", error);
                    });

                    return { reminders: updated };
                });
            },

            nagMember: (reminderId) => {
                console.log('Nagging member for reminder:', reminderId);
                // In real app: Call Edge Function to send push notification
                // For MVP: Local Alert (handled in UI) or just log
            }
        }),
        {
            name: 'echo-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
