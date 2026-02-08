import { z } from 'zod';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'hourly' | 'minutely';

export interface RecurrenceConfig {
    type: RecurrenceType;
    interval?: number;     // e.g., every 2 weeks
    weekdays?: number[];   // 1=Mon, 7=Sun (compatible with date-fns isoDay)
    dayOfMonth?: number;   // 1..31
}

export const RecurrenceSchema = z.object({
    type: z.enum(['none', 'daily', 'weekly', 'monthly', 'weekdays', 'hourly', 'minutely']),
    interval: z.number().optional(),
    weekdays: z.array(z.number()).optional(),
    dayOfMonth: z.number().optional(),
});

export interface Category {
    id: string;
    name: string;
    color: string;
    icon?: string; // Ionicons name
    isDefault?: boolean;
}

export const CategorySchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    color: z.string(),
    icon: z.string().optional(),
    isDefault: z.boolean().optional(),
});

export type ReminderStatus = 'active' | 'done';

export interface Reminder {
    id: string;            // UUID
    user_id?: string;      // Placeholder for Supabase
    category_id?: string;  // Link to Category
    title: string;
    notes?: string;

    status: ReminderStatus;

    due_at: string;        // ISO Date String (User INTENT)
    next_fire_at: string;  // ISO Date String (Scheduling)

    recurrence: RecurrenceConfig;
    snooze_preset_mins?: number[];

    created_at: string;    // ISO
    updated_at: string;    // ISO
    deleted_at?: string;   // ISO (Soft delete for sync)
    version: number;       // Increment on every edit
    last_action?: 'create' | 'edit' | 'snooze' | 'done' | 'undone';
    snooze_count: number;  // Track snoozes for Adaptive logic

    // Family Loop
    household_id?: string;
    assignee_id?: string;
    completed_by?: string;
    proof_url?: string;
}

export const ReminderSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    notes: z.string().optional(),
    status: z.enum(['active', 'done']),
    due_at: z.string().datetime(),
    next_fire_at: z.string().datetime(),
    recurrence: RecurrenceSchema,
    snooze_preset_mins: z.array(z.number()).optional(),
    created_at: z.string().datetime().optional(), // Server gen
    updated_at: z.string().datetime().optional(),
    snooze_count: z.number().default(0),
    household_id: z.string().uuid().optional(),
    assignee_id: z.string().uuid().optional(),
    completed_by: z.string().uuid().optional(),
    proof_url: z.string().url().optional(),
});

export interface Household {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
    invite_code?: string; // Added via migration
    members?: HouseholdMember[]; // Hydrated
    created_by_profile?: { full_name?: string, email: string };
}

export interface HouseholdMember {
    household_id: string;
    user_id: string;
    role: 'admin' | 'member' | 'child';
    joined_at: string;
    profile?: { email: string; full_name?: string; avatar_url?: string }; // Hydrated
}

// Main User Profile (matches Supabase 'profiles' table)
export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

export interface UserSettings {
    snooze_presets_mins: number[];
    timezone: string;
    notifications_enabled: boolean;
}

export interface StreamItem {
    id: string;
    stream_id: string;
    title: string;
    recurrence_rule: RecurrenceConfig;
    day_offset: number;
    time_of_day?: string;
}

export interface Stream {
    id: string;
    creator_id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    is_public: boolean;
    likes_count: number;
    created_at: string;
    items?: StreamItem[]; // Hydrated
}
