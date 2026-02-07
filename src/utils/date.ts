import { format, isSameYear, isToday, isTomorrow, parseISO } from 'date-fns';

export function formatDueTime(isoString: string): string {
    const date = parseISO(isoString);
    const timeStr = format(date, 'h:mm a');

    if (isToday(date)) {
        return timeStr;
    }

    if (isTomorrow(date)) {
        return `Tomorrow ${timeStr}`;
    }

    // If it's in the past (overdue) but stil "Active", we might want to flag it, 
    // but the request is about "resetting" future tasks.
    // Let's just focus on the date part.

    if (isSameYear(date, new Date())) {
        return `${format(date, 'MMM d')} ${timeStr}`;
    }

    return `${format(date, 'MMM d, yyyy')} ${timeStr}`;
}
