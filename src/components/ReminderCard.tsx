import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useStore } from '../store/useStore';
import { Avatar } from './Avatar';
import { ThemedText } from './ThemedText';

interface ReminderCardProps {
    id: string;
    title: string;
    time: string;
    isCompleted?: boolean;
    onComplete: () => void;
    onDelete: () => void;
    onEdit: () => void;
    householdId?: string;
    assigneeId?: string;
}

export function ReminderCard({ id, title, time, isCompleted, onComplete, onDelete, onEdit, householdId, assigneeId }: ReminderCardProps) {
    const currentHousehold = useStore(state => state.currentHousehold);
    const userId = useStore(state => state.userId);
    const nagMember = useStore(state => state.nagMember);

    // Resolve Assignee
    const assignee = householdId && assigneeId && currentHousehold?.members
        ? currentHousehold.members.find(m => m.user_id === assigneeId)
        : null;

    // Fallback name logic: Profile name -> Profile email -> 'Unknown'
    const assigneeName = assignee?.profile?.full_name?.split(' ')[0]
        || assignee?.profile?.email?.split('@')[0]
        || 'Family Member';

    const isMe = assigneeId === userId;

    const showActionMenu = () => {
        Haptics.selectionAsync();

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Edit Details', 'Delete'],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0,
                    userInterfaceStyle: 'dark',
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) onEdit();
                    if (buttonIndex === 2) onDelete();
                }
            );
        } else {
            Alert.alert(
                'Task Options',
                title,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Snooze', onPress: handleSnooze }, // Added Snooze
                    { text: 'Edit', onPress: onEdit },
                    { text: 'Delete', onPress: onDelete, style: 'destructive' },
                ]
            );
        }
    };

    const handleSnooze = () => {
        // Use Store directly to avoid prop drilling for this specific logic if complex
        // For MVP, we need to know the current snooze count.
        // Since we don't pass the full reminder object here, we might need to fetch it or pass it down.
        // Let's assume we can get it from the store or props.
        // Ideally props should have it. Let's update props first.
        const state = require('../store/useStore').useStore.getState();
        const reminder = state.reminders.find((r: any) => r.id === id);

        if (!reminder) return;

        const snoozeCount = reminder.snooze_count || 0;

        if (snoozeCount >= 2) {
            // Adaptive Nudge
            const suggestedTime = new Date();
            suggestedTime.setHours(suggestedTime.getHours() + 2); // Mock logic: +2 hours
            const timeString = suggestedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            Alert.alert(
                "You've snoozed this a few times.",
                `You usually complete tasks like this around ${timeString}. Want to reschedule?`,
                [
                    {
                        text: 'Yes, Reschedule',
                        onPress: () => {
                            state.updateReminder(id, {
                                due_at: suggestedTime.toISOString(),
                                next_fire_at: suggestedTime.toISOString(),
                                snooze_count: 0 // Reset on meaningful reschedule
                            });
                        }
                    },
                    {
                        text: 'No, just snooze',
                        style: 'cancel',
                        onPress: showStandardSnoozeOptions
                    }
                ]
            );
        } else {
            showStandardSnoozeOptions();
        }
    };

    const showStandardSnoozeOptions = () => {
        const state = require('../store/useStore').useStore.getState();
        Alert.alert(
            'Snooze until...',
            undefined,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: '10 Minutes', onPress: () => state.snoozeReminder(id, 10) },
                { text: '1 Hour', onPress: () => state.snoozeReminder(id, 60) },
                { text: 'Tomorrow', onPress: () => state.snoozeReminder(id, 1440) }, // Simple +24h
            ]
        );
    }


    const handleComplete = () => {
        console.log('ReminderCard: handleComplete called', { id, title, isCompleted });
        if (isCompleted) {
            console.log('ReminderCard: Already completed, returning');
            return; // Idempotency lock
        }
        console.log('ReminderCard: Calling onComplete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
    };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {/* Main Tap Area: Complete Task */}
                <Pressable
                    onPress={handleComplete}
                    style={({ pressed }) => [styles.mainTouchArea, pressed && { opacity: 0.7 }]}
                >
                    <View style={[styles.checkboxBase, isCompleted && styles.checkboxChecked]}>
                        {isCompleted && <Ionicons name="checkmark" size={16} color={Colors.dark.background} />}
                        {!isCompleted && <View style={styles.checkboxInner} />}
                    </View>

                    <View style={styles.rowContent}>
                        <ThemedText weight="medium" style={[styles.title, isCompleted && styles.completedText]} numberOfLines={1}>
                            {title}
                        </ThemedText>
                        <ThemedText variant="caption" color={Colors.dark.textSecondary} numberOfLines={1}>
                            {time}
                        </ThemedText>
                    </View>
                </Pressable>

                {/* Secondary Tap Area: Menu (Stop Propagation) */}
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        showActionMenu();
                    }}
                    hitSlop={15}
                    style={({ pressed }) => [styles.menuButton, pressed && { opacity: 0.5 }]}
                >
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.dark.textSecondary} />
                </Pressable>
            </View>

            {/* Family Loop Footer */}
            {householdId && assigneeId && (
                <View style={styles.footer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar name={assigneeName} size={24} />
                        <ThemedText variant="caption" color={Colors.dark.textSecondary} style={{ marginLeft: 8 }}>
                            {isMe ? "Assigned to You" : `Assigned to ${assigneeName}`}
                        </ThemedText>
                    </View>

                    {!isCompleted && !isMe && (
                        <Pressable
                            style={({ pressed }) => [styles.nagButton, pressed && { opacity: 0.7 }]}
                            onPress={() => {
                                nagMember(id);
                                Alert.alert("Nudge Sent!", `${assigneeName} has been notified.`);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            }}
                        >
                            <Ionicons name="notifications-outline" size={14} color={Colors.dark.primary} />
                            <ThemedText variant="caption" color={Colors.dark.primary} weight="bold" style={{ marginLeft: 4 }}>
                                Nudge
                            </ThemedText>
                        </Pressable>
                    )}
                </View>
            )}
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        marginHorizontal: 16,
        borderRadius: 16,
        backgroundColor: Colors.dark.surface,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: Colors.dark.surface,
    },
    mainTouchArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    checkboxBase: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    },
    checkboxInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'transparent',
    },
    title: {
        fontSize: 17,
        color: Colors.dark.text,
        marginBottom: 2,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: Colors.dark.textSecondary,
    },
    menuButton: {
        padding: 4,
        paddingLeft: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 4,
    },
    nagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: Colors.dark.surfaceHighlight,
        borderRadius: 12,
    }
});
