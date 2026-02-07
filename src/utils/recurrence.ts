import { addDays, addHours, addMinutes, addMonths, getDay, isBefore, set } from 'date-fns';
import { RecurrenceConfig } from '../types';

/**
 * Computes the next fire time based on recurrence rules.
 * 
 * @param recurrence The recurrence rule
 * @param baseDueAt ISO string of the original due date (anchor)
 * @param fromTime ISO string of the current time (or time of action)
 * @returns ISO string of the next fire time
 */
export function computeNextFireAt(
    recurrence: RecurrenceConfig,
    baseDueAt: string,
    fromTime: string = new Date().toISOString()
): string {
    console.log('computeNextFireAt called:', {
        recurrenceType: recurrence.type,
        recurrenceWeekdays: recurrence.weekdays,
        recurrenceInterval: recurrence.interval,
        baseDueAt,
        fromTime
    });

    const baseDate = new Date(baseDueAt);
    const fromDate = new Date(fromTime);
    const now = new Date();

    // Helper to extract time components from baseDate
    const timeComponents = {
        hours: baseDate.getHours(),
        minutes: baseDate.getMinutes(),
        seconds: baseDate.getSeconds(),
        milliseconds: 0
    };

    // If no recurrence, and we are just rescheduling (e.g. un-snoozing or initial create),
    // usually we just return the due date. 
    // But if the due date is in the past and it's a NEW creation, the caller handles that logic.
    // This function assumes we are finding the *next* occurrence relative to `fromTime`.

    if (recurrence.type === 'none') {
        return baseDueAt;
    }

    // Special handling for sub-daily recurrences (hourly, minutely) to avoid infinite loop of days
    if (recurrence.type === 'hourly' || recurrence.type === 'minutely') {
        let candidate = new Date(fromDate);

        // If fromDate is before baseDate, start at baseDate
        if (isBefore(candidate, baseDate)) {
            candidate = new Date(baseDate);
        }

        // Align candidate to baseDate's minutes/seconds if hourly
        // Align candidate to baseDate's seconds if minutely
        // This ensures "every hour at :15" matches properly
        if (recurrence.type === 'hourly') {
            candidate = set(candidate, {
                minutes: timeComponents.minutes,
                seconds: timeComponents.seconds,
                milliseconds: 0
            });
            // If we are still before fromDate after aligning, jump forward
            if (isBefore(candidate, fromDate)) {
                candidate = addHours(candidate, 1);
            }
        } else if (recurrence.type === 'minutely') {
            candidate = set(candidate, {
                seconds: timeComponents.seconds,
                milliseconds: 0
            });
            if (isBefore(candidate, fromDate)) {
                candidate = addMinutes(candidate, 1);
            }
        }

        // Ensure strictly future
        while (!isBefore(new Date(fromDate), candidate) && candidate.getTime() !== new Date(fromDate).getTime()) {
            // if equal or before, move next
            candidate = advanceCandidate(candidate, recurrence);
        }

        // One final check: if we are exactly at fromDate, and we want "next", advance one more
        if (candidate.getTime() <= new Date(fromDate).getTime()) {
            candidate = advanceCandidate(candidate, recurrence);
        }

        return candidate.toISOString();
    }

    // Existing logic for Daily/Weekly/Monthly (Day-based iteration)
    // ... (rest of function)

    let candidateDate = new Date(fromDate);
    // ... ensure strict future or now
    if (isBefore(candidateDate, baseDate)) {
        candidateDate = new Date(baseDate);
    }

    // Normalize to start of day for rule matching, but keep time for result? 
    // Actually existing logic sets time components at end of loop.

    // Ensure candidate has the correct time-of-day
    candidateDate = set(candidateDate, timeComponents);

    // If candidate is in the past (before fromDate), move it forward
    if (isBefore(candidateDate, fromDate)) {
        // Move to 'tomorrow' or next logical step as a baseline, then apply rules
        candidateDate = addDays(candidateDate, 1);
        candidateDate = set(candidateDate, timeComponents);
    }

    // Safety break
    let iterations = 0;

    while (iterations < 1000) {
        iterations++;

        // Check if candidateDate allows the rule
        if (matchesRule(candidateDate, recurrence, baseDate)) {
            return candidateDate.toISOString();
        }

        // Advance candidate
        candidateDate = advanceCandidate(candidateDate, recurrence);
        candidateDate = set(candidateDate, timeComponents); // Keep time stable
    }

    // Fallback
    return addDays(new Date(fromTime), 1).toISOString();
}

function matchesRule(date: Date, rule: RecurrenceConfig, baseDate: Date): boolean {
    if (rule.type === 'daily') {
        // Check interval
        if (rule.interval && rule.interval > 1) {
            // Simple check: days since baseDate % interval === 0
            // This is tricky if baseDate is far behind. 
            // For MVP, we'll assume daily interval=1 implies every day.
            // If interval > 1, we need to respect the phase.
            const diffDays = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays % rule.interval === 0;
        }
        return true;
    }

    if (rule.type === 'weekdays') {
        const day = getDay(date); // 0=Sun, 1=Mon...
        return day >= 1 && day <= 5;
    }

    if (rule.type === 'weekly') {
        const day = getDay(date); // 0=Sun
        // Convert 0=Sun to 7=Sun for ISO or just map user input
        // Our type says 1=Mon...7=Sun. date-fns getDay returns 0..6 (Sun..Sat)
        const isoDay = day === 0 ? 7 : day;

        console.log('matchesRule weekly:', {
            date: date.toISOString(),
            isoDay,
            weekdays: rule.weekdays,
            hasWeekdays: rule.weekdays && rule.weekdays.length > 0
        });

        // If weekdays is specified, check if current day is in the list
        if (rule.weekdays && rule.weekdays.length > 0) {
            if (rule.weekdays.includes(isoDay)) {
                if (rule.interval && rule.interval > 1) {
                    const diffWeeks = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                    return diffWeeks % rule.interval === 0;
                }
                console.log('matchesRule: TRUE (weekdays match)');
                return true;
            }
            console.log('matchesRule: FALSE (weekdays no match)');
            return false;
        }

        // If weekdays is empty, match the same day of week as baseDate
        const baseDay = getDay(baseDate);
        const baseIsoDay = baseDay === 0 ? 7 : baseDay;
        console.log('matchesRule weekly (no weekdays):', {
            baseIsoDay,
            isoDay,
            matches: isoDay === baseIsoDay
        });
        if (isoDay === baseIsoDay) {
            if (rule.interval && rule.interval > 1) {
                const diffWeeks = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
                return diffWeeks % rule.interval === 0;
            }
            console.log('matchesRule: TRUE (same day as base)');
            return true;
        }
        console.log('matchesRule: FALSE (different day)');
        return false;
    }

    if (rule.type === 'monthly') {
        const targetDay = rule.dayOfMonth || baseDate.getDate();
        return date.getDate() === targetDay;
    }

    return false;
}

function advanceCandidate(date: Date, rule: RecurrenceConfig): Date {
    if (rule.type === 'hourly') {
        return addHours(date, rule.interval || 1);
    }
    if (rule.type === 'minutely') {
        return addMinutes(date, rule.interval || 1);
    }
    if (rule.type === 'monthly') {
        // Move to next month
        return addMonths(date, rule.interval || 1);
    }
    // For weekly with specific weekdays, advance day-by-day to find next matching weekday
    if (rule.type === 'weekly' && rule.weekdays && rule.weekdays.length > 0) {
        return addDays(date, 1);
    }
    // For weekly without weekdays (simple "every week"), jump 7 days
    if (rule.type === 'weekly') {
        return addDays(date, (rule.interval || 1) * 7);
    }

    // Daily default
    return addDays(date, rule.interval || 1);
}
