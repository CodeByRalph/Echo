import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMinutes } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { Category, Reminder, UserSettings } from '../types';
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
                        set({ userId: null, reminders: [], activity: {} });
                        return;
                    }

                    // Fetch Data from Supabase (RLS filters by user_id automatically)
                    const { data: reminders, error: remindersError } = await supabase.from('reminders').select('*').is('deleted_at', null);
                    if (remindersError) console.error('Reminders fetch error:', remindersError);

                    const { data: categories, error: categoriesError } = await supabase.from('categories').select('*');
                    if (categoriesError) console.error('Categories fetch error:', categoriesError);

                    const { data: activity, error: activityError } = await supabase.from('activity').select('*');
                    if (activityError) console.error('Activity fetch error:', activityError);

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
                        }, {})
                    }));
                } catch (e) {
                    console.error('Hydration Action Failed:', e);
                }
            },

            resetState: () => {
                set({ userId: null, reminders: [], activity: {} });
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
                    category_id: reminderData.category_id
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
        }),
        {
            name: 'echo-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Note: we removed onRehydrateStorage calling hydrate() here, 
            // because we call it explicitly on auth state change to avoid double fetching or fetching before auth.
        }
    )
);
