import { addDays, addMinutes } from 'date-fns';
import { useStore } from '../store/useStore';

export function seedData() {
    const store = useStore.getState();
    if (store.reminders.length > 0) return;

    const now = new Date();

    store.addReminder({
        title: "Buy Groceries",
        notes: "Milk, Eggs, Bread",
        status: 'active',
        due_at: addMinutes(now, 30).toISOString(),
        next_fire_at: addMinutes(now, 30).toISOString(),
        recurrence: { type: 'none' },
        snooze_count: 0,
        version: 1
    });

    store.addReminder({
        title: "Pay Rent",
        status: 'active',
        due_at: addDays(now, 1).toISOString(),
        next_fire_at: addDays(now, 1).toISOString(),
        recurrence: { type: 'monthly', dayOfMonth: 1 },
        snooze_count: 0,
        version: 1
    });

    const tomorrowMorning = new Date(addDays(now, 1));
    tomorrowMorning.setHours(9, 30, 0, 0);

    store.addReminder({
        title: "Morning Standup",
        status: 'active',
        due_at: tomorrowMorning.toISOString(),
        next_fire_at: tomorrowMorning.toISOString(),
        recurrence: { type: 'weekdays' },
        snooze_count: 0,
        version: 1
    });
}
