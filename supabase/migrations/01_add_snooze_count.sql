-- Add snooze_count column to reminders table to track adaptive snooze suggestions
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS snooze_count INTEGER DEFAULT 0;
