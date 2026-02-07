import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { Reminder } from '../types';

const CATEGORY_ID = 'REMINDER_ACTIONS';

export const NotificationService = {
    async init() {
        // 1. Request Permissions
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
                console.log('Permission not granted for notifications');
                return;
            }
        }

        // 2. Set Handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true, // Keep for backward compatibility if needed, but rely on others
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            }),
        });

        // 3. Define Actions
        if (Platform.OS !== 'web') {
            await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
                {
                    identifier: 'SNOOZE_10',
                    buttonTitle: 'Snooze 10m',
                    options: { opensAppToForeground: false },
                },
                {
                    identifier: 'SNOOZE_60',
                    buttonTitle: 'Snooze 1h',
                    options: { opensAppToForeground: false },
                },
                {
                    identifier: 'SNOOZE_CUSTOM',
                    buttonTitle: 'Snooze (Custom)',
                    textInput: {
                        submitButtonTitle: 'Snooze',
                        placeholder: 'Minutes (e.g. 22)',
                    },
                    options: { opensAppToForeground: false },
                },
                {
                    identifier: 'DONE',
                    buttonTitle: 'Done',
                    options: { opensAppToForeground: false },
                },
            ]);
        }

        // 4. Add Listeners
        Notifications.addNotificationResponseReceivedListener(response => {
            const actionId = response.actionIdentifier;
            const reminderId = response.notification.request.content.data.reminderId as string;

            if (actionId === 'SNOOZE_10') {
                useStore.getState().snoozeReminder(reminderId, 10);
            } else if (actionId === 'SNOOZE_60') {
                useStore.getState().snoozeReminder(reminderId, 60);
            } else if (actionId === 'SNOOZE_CUSTOM') {
                const text = (response as any).userText;
                const minutes = parseInt(text, 10);
                if (!isNaN(minutes) && minutes > 0) {
                    useStore.getState().snoozeReminder(reminderId, minutes);
                } else {
                    // Fallback or error? For MVP, snooze 10m if invalid
                    useStore.getState().snoozeReminder(reminderId, 10);
                }
            } else if (actionId === 'DONE') {
                useStore.getState().completeReminder(reminderId);
            } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
                // Opened app
                // Could navigate to detail, for now just open app
            }
        });
    },

    async scheduleReminder(reminder: Reminder, enabled: boolean = true) {
        if (!enabled) return;

        // Ideally we map ID -> NotificationID to update/cancel. 
        // For MVP, we use the Reminder ID as the identifier (Expo allows string IDs).

        // Check if it should be scheduled
        // Logic: if next_fire_at is effectively in the future.

        const triggerDate = new Date(reminder.next_fire_at);
        if (triggerDate.getTime() <= Date.now()) {
            // Already passed? If it's very recent (e.g. while app was closed), maybe show?
            // For now, only schedule future.
            return;
        }

        try {
            await Notifications.scheduleNotificationAsync({
                identifier: reminder.id,
                content: {
                    title: 'Reminder',
                    body: reminder.title,
                    sound: true,
                    data: { reminderId: reminder.id },
                    categoryIdentifier: CATEGORY_ID,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate
                },
            });
        } catch (e) {
            console.warn("Failed to schedule notification", e);
        }
    },

    async cancelReminder(reminderId: string) {
        await Notifications.cancelScheduledNotificationAsync(reminderId);
    },

    async resyncNotifications(reminders: Reminder[], enabled: boolean = true) {
        // Brute force sync: cancel all, reschedule all active
        // In prod, be smarter.
        await Notifications.cancelAllScheduledNotificationsAsync();

        if (!enabled) return;

        const active = reminders.filter(r => r.status === 'active' && !r.deleted_at);
        for (const r of active) {
            await this.scheduleReminder(r, enabled);
        }
    }
};
