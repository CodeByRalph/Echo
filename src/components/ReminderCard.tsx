import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BlurredBottomSheet } from './BlurredBottomSheet';
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
    const [showActions, setShowActions] = useState(false);
    const [showSnooze, setShowSnooze] = useState(false);
    const [showReschedulePrompt, setShowReschedulePrompt] = useState(false);
    const [showNudgeNotice, setShowNudgeNotice] = useState(false);

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
        setShowActions(true);
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
            setShowReschedulePrompt(true);
        } else {
            showStandardSnoozeOptions();
        }
    };

    const showStandardSnoozeOptions = () => {
        setShowSnooze(true);
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
        <>
        <View style={styles.container}>
            <View style={styles.row}>
                {/* Main Tap Area: Complete Task */}
                <Pressable
                    onPress={handleComplete}
                    style={({ pressed }) => [
                        styles.mainTouchArea,
                        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                    ]}
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
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                setShowNudgeNotice(true);
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
        <BlurredBottomSheet
            visible={showActions}
            onClose={() => setShowActions(false)}
            title="Task options"
            subtitle={title}
            actions={[
                { label: 'Snooze', tone: 'accent', onPress: () => { setShowActions(false); handleSnooze(); } },
                { label: 'Edit details', onPress: () => { setShowActions(false); onEdit(); } },
                { label: 'Delete reminder', tone: 'destructive', onPress: () => { setShowActions(false); onDelete(); } }
            ]}
        />
        <BlurredBottomSheet
            visible={showSnooze}
            onClose={() => setShowSnooze(false)}
            title="Snooze until"
            actions={[
                { label: '10 minutes', onPress: () => { setShowSnooze(false); useStore.getState().snoozeReminder(id, 10); } },
                { label: '1 hour', onPress: () => { setShowSnooze(false); useStore.getState().snoozeReminder(id, 60); } },
                { label: 'Tomorrow', onPress: () => { setShowSnooze(false); useStore.getState().snoozeReminder(id, 1440); } }
            ]}
        />
        <BlurredBottomSheet
            visible={showReschedulePrompt}
            onClose={() => setShowReschedulePrompt(false)}
            title="You're snoozing often"
            subtitle="Want to reschedule instead?"
            actions={[
                {
                    label: 'Reschedule +2 hours',
                    tone: 'accent',
                    onPress: () => {
                        const suggestedTime = new Date();
                        suggestedTime.setHours(suggestedTime.getHours() + 2);
                        useStore.getState().updateReminder(id, {
                            due_at: suggestedTime.toISOString(),
                            next_fire_at: suggestedTime.toISOString(),
                            snooze_count: 0
                        });
                        setShowReschedulePrompt(false);
                    }
                },
                {
                    label: 'Just snooze',
                    onPress: () => { setShowReschedulePrompt(false); setShowSnooze(true); }
                }
            ]}
        />
        <BlurredBottomSheet
            visible={showNudgeNotice}
            onClose={() => setShowNudgeNotice(false)}
            title="Nudge sent"
            subtitle={`${assigneeName} has been notified.`}
            actions={[{ label: 'Done', onPress: () => setShowNudgeNotice(false) }]}
        />
        </>
    );
}



const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        marginHorizontal: 12,
        borderRadius: 20,
        backgroundColor: Colors.dark.surfaceElevated,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: Colors.dark.shadow,
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 18,
        backgroundColor: 'transparent',
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
        backgroundColor: 'rgba(147,197,253,0.12)',
        borderRadius: 12,
    }
});
