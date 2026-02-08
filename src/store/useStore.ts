import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMinutes } from 'date-fns';
import { Alert } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { PurchaseService } from '../services/purchase';
import { Category, Household, Reminder, Stream, UserProfile, UserSettings } from '../types';
import { computeNextFireAt } from '../utils/recurrence';

interface AppState {
    reminders: Reminder[];
    categories: Category[];
    settings: UserSettings;
    isPro: boolean;
    userId: string | null;
    userProfile: UserProfile | null;
    activity: Record<string, number>;

    // Actions
    // Actions
    hydrate: () => Promise<void>;
    signOut: () => Promise<void>;
    resetState: () => void;
    checkProStatus: () => Promise<void>;
    purchasePro: () => Promise<void>;
    togglePro: () => void; // Keeping for dev

    addReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
    updateReminder: (id: string, updates: Partial<Reminder>) => void;
    deleteReminder: (id: string) => void;

    addCategory: (name: string, color: string, icon?: string) => void;

    completeReminder: (id: string) => void;
    snoozeReminder: (id: string, minutes: number) => void;

    updateSettings: (updates: Partial<UserSettings>) => void;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

    // Community Streams
    publicStreams: Stream[];
    fetchPublicStreams: () => Promise<void>;
    createStream: (title: string, description: string, items: { title: string, recurrence_rule: any, day_offset: number, time_of_day?: string }[]) => Promise<void>;
    subscribeToStream: (streamId: string) => Promise<void>;

    // Family Loop
    households: Household[];
    activeHouseholdId: string | null;
    createHousehold: (name: string) => Promise<void>;
    joinHousehold: (inviteCode: string) => Promise<void>; // Mock
    fetchHouseholdMembers: () => Promise<void>;
    assignReminder: (reminderId: string, userId: string) => void;
    nagMember: (reminderId: string) => void;
    leaveHousehold: (householdId?: string) => Promise<void>;
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
            userProfile: null,
            activity: {},
            households: [],
            activeHouseholdId: null,
            settings: {
                snooze_presets_mins: [10, 60, 180],
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                notifications_enabled: true,
            },

            hydrate: async () => {
                // Check Pro Status on launch
                await get().checkProStatus();

                try {
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    if (userError) throw userError;

                    if (!user) {
                        set({ userId: null, userProfile: null, reminders: [], activity: {}, households: [], activeHouseholdId: null });
                        return;
                    }

                    // Fetch Data from Supabase (RLS filters by user_id automatically)
                    const { data: reminders, error: remindersError } = await supabase.from('reminders').select('*').is('deleted_at', null);
                    if (remindersError) console.error('Reminders fetch error:', remindersError);

                    const { data: categories, error: categoriesError } = await supabase.from('categories').select('*');
                    if (categoriesError) console.error('Categories fetch error:', categoriesError);

                    const { data: activity, error: activityError } = await supabase.from('activity').select('*');
                    if (activityError) console.error('Activity fetch error:', activityError);

                    // Fetch Profile
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    if (profile) set({ userProfile: profile });

                    // Fetch Households
                    let households: Household[] = [];
                    const { data: householdMemberships } = await supabase.from('household_members').select('household_id').eq('user_id', user.id);

                    if (householdMemberships && householdMemberships.length > 0) {
                        const householdIds = householdMemberships.map(m => m.household_id);
                        const { data: householdsData } = await supabase.from('households').select('*, created_by_profile:created_by(full_name, email)').in('id', householdIds);

                        if (householdsData) {
                            households = householdsData as any; // Need to cast due to join
                            // Fetch members for each? Or just fetch on demand?
                            // For MVP, let's fetch members for the first one or active one.
                        }
                    }

                    // For now, set active to the first one found, or persisted one if we had it (but we don't persist activeHouseholdId yet)
                    const activeHouseholdId = households.length > 0 ? households[0].id : null;
                    if (activeHouseholdId) {
                        const { data: members } = await supabase.from('household_members').select('*, profiles:user_id(email, full_name, avatar_url)').eq('household_id', activeHouseholdId);
                        const activeHousehold = households.find(h => h.id === activeHouseholdId);
                        if (activeHousehold) {
                            activeHousehold.members = members || [];
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

                        households,
                        activeHouseholdId
                    }));
                } catch (e) {
                    console.error('Hydration Action Failed:', e);
                }
            },

            resetState: () => set({ reminders: [], userId: null, userProfile: null, activity: {}, households: [], activeHouseholdId: null, publicStreams: [] }),

            signOut: async () => {
                await supabase.auth.signOut();
                get().resetState();
            },

            checkProStatus: async () => {
                await PurchaseService.init();
                const isPro = await PurchaseService.checkProStatus();
                set({ isPro });
            },

            purchasePro: async () => {
                // Simplified flow: Get packages, buy first available (usually monthly/annual)
                // For MVP, we'll try to buy the first package found
                try {
                    const packages = await PurchaseService.getPackages();
                    if (packages.length > 0) {
                        const success = await PurchaseService.purchasePackage(packages[0]);
                        if (success) {
                            set({ isPro: true });
                        }
                    }
                } catch (e) {
                    console.error('Purchase failed', e);
                }
            },

            addCategory: (name, color, icon) => set((state) => {
                if (!state.userId) return state;

                // Feature Limit: Free users max 3 custom categories
                const customCats = state.categories.filter(c => !c.isDefault);
                if (!state.isPro && customCats.length >= 3) {
                    Alert.alert("Echo Pro Required", "Free users can only create 3 custom lists. Upgrade to create unlimited lists.");
                    return state;
                }

                const newCategory: Category = {
                    id: generateId(),
                    name,
                    color,
                    icon,
                    isDefault: false
                };

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
                if (!state.userId) return state;

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

            updateSettings: (updates) => set((state) => {
                if ('snooze_presets_mins' in updates && !state.isPro) {
                    Alert.alert("Echo Pro Required", "Custom snooze presets are a Pro feature.");
                    // Remove the restricted key but allow other updates
                    const { snooze_presets_mins, ...allowedUpdates } = updates;
                    return { settings: { ...state.settings, ...allowedUpdates } };
                }
                return { settings: { ...state.settings, ...updates } };
            }),

            updateProfile: async (updates) => {
                const state = get();
                if (!state.userId) return;

                const { error } = await supabase.from('profiles').update(updates).eq('id', state.userId);

                if (error) {
                    console.error("Error updating profile:", error);
                    Alert.alert("Error", "Failed to update profile.");
                    return;
                }

                set((state) => ({
                    userProfile: state.userProfile ? { ...state.userProfile, ...updates } : null
                }));
            },

            // Community Streams Actions
            publicStreams: [],

            fetchPublicStreams: async () => {
                const { data, error } = await supabase
                    .from('streams')
                    .select('*, items:stream_items(*)')
                    .eq('is_public', true)
                    .order('likes_count', { ascending: false });

                if (error || !data || data.length === 0) {
                    // Mock fall back
                    set({ publicStreams: [] });
                    return;
                }

                set({ publicStreams: data as any[] });
            },

            createStream: async (title, description, items) => {
                const state = get();
                if (!state.userId) return;

                // Feature Limit: Free users cannot create streams
                if (!state.isPro) {
                    Alert.alert("Echo Pro Required", "Only Pro members can create public community lists.");
                    return;
                }

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
                    Alert.alert("Error", "Failed to create stream.");
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

                    await supabase.from('stream_items').insert(streamItems);
                }

                // Refresh
                await state.fetchPublicStreams();
            },

            subscribeToStream: async (streamId) => {
                const state = get();
                if (!state.userId) return;

                // Free users CAN subscribe, so no check here.

                let stream = state.publicStreams.find(s => s.id === streamId);
                if (!stream) return;

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
                await supabase.from('reminders').insert(newReminders);
                set(s => ({ reminders: [...s.reminders, ...newReminders] }));
            },

            // Family Loop Actions

            createHousehold: async (name) => {
                const state = get();
                if (!state.userId) return;

                // Feature Limit: Free users Max 1 Family
                if (!state.isPro && state.households.length >= 1) {
                    Alert.alert("Echo Pro Required", "Free users can only have one family space. Upgrade to create another.");
                    return;
                }

                // Temporary: Enforce 1 family limit for everyone until UI supports switching fully
                // Actually, the UI request IS to support list. So for Pro, we allow more.

                const now = new Date().toISOString();

                // Call secure RPC
                const { data, error } = await supabase.rpc('create_household', { name_input: name });

                if (error || !data.success) {
                    Alert.alert("Failed", data?.message || "Could not create household.");
                    return;
                }

                // Fetch the Creator Profile (current user)
                // Or just mock it since we know it's us?
                // Ideally we have state.userProfile
                const creatorProfile = state.userProfile || { email: 'me' };

                const newHousehold: Household = {
                    id: data.household_id,
                    name,
                    created_by: state.userId!,
                    created_at: now,
                    members: [], // will fetch
                    invite_code: data.invite_code,
                    // @ts-ignore
                    created_by_profile: creatorProfile
                };

                // Add to list and make active
                set({
                    households: [...state.households, newHousehold],
                    activeHouseholdId: newHousehold.id
                });

                await state.fetchHouseholdMembers();
            },

            joinHousehold: async (inviteCode) => {
                const state = get();
                if (!state.userId) return;

                // Feature Limit: Free users Max 1 Family
                if (!state.isPro && state.households.length >= 1) {
                    Alert.alert("Echo Pro Required", "Free users can only join one family space.");
                    return;
                }

                // Check if already in it? (RPC handles it usually, but we can check locally)

                // Call secure RPC
                const { data, error } = await supabase.rpc('join_household', { invite_code_input: inviteCode });

                if (error || !data.success) {
                    Alert.alert("Failed", data?.message || "Could not join household.");
                    return;
                }

                // Success
                // Fetch household details
                const { data: household } = await supabase.from('households').select('*, created_by_profile:created_by(full_name, email)').eq('id', data.household_id).single();

                if (household) {
                    set({
                        households: [...state.households, household as any],
                        activeHouseholdId: household.id
                    });
                    await get().fetchHouseholdMembers();
                }
            },

            leaveHousehold: async (householdId) => {
                const state = get();
                const targetId = householdId || state.activeHouseholdId;
                if (!state.userId || !targetId) return;

                // Delete membership
                const { error } = await supabase.from('household_members')
                    .delete()
                    .eq('household_id', targetId)
                    .eq('user_id', state.userId);

                if (error) {
                    Alert.alert("Error", "Failed to leave household.");
                    return;
                }

                // Clear local state
                const newHouseholds = state.households.filter(h => h.id !== targetId);
                const newActiveId = state.activeHouseholdId === targetId
                    ? (newHouseholds.length > 0 ? newHouseholds[0].id : null)
                    : state.activeHouseholdId;

                set({
                    households: newHouseholds,
                    activeHouseholdId: newActiveId
                });
            },

            fetchHouseholdMembers: async () => {
                // Fetch members for active household
                const state = get();
                if (!state.activeHouseholdId) return;

                const { data, error } = await supabase
                    .from('household_members')
                    .select('*, profiles:user_id(email, full_name, avatar_url)') // Now relying on public.profiles
                    .eq('household_id', state.activeHouseholdId);

                if (error) {
                    console.error('Error fetching members', error);
                    return;
                }

                // Update state
                set(s => ({
                    households: s.households.map(h => h.id === s.activeHouseholdId ? { ...h, members: data as any[] } : h)
                }));
            },

            assignReminder: (reminderId, userId) => {
                set(state => {
                    if (!state.activeHouseholdId) return {};

                    // Optimistic update
                    const updated = state.reminders.map(r => r.id === reminderId ? { ...r, assignee_id: userId, household_id: state.activeHouseholdId || undefined } : r);

                    // DB Update
                    supabase.from('reminders').update({ assignee_id: userId, household_id: state.activeHouseholdId }).eq('id', reminderId).then(({ error }) => {
                        if (error) console.error("Error assigning reminder:", error);
                    });

                    return { reminders: updated };
                });
            },

            nagMember: (reminderId) => {
                // In real app: Call Edge Function to send push notification
            }
        }),
        {
            name: 'echo-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
