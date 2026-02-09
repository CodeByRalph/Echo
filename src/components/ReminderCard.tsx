import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
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
    isRecurring?: boolean;
    onComplete: () => void;
    onDelete: () => void;
    onEdit: () => void;
    householdId?: string;
    assigneeId?: string;
}

export const ReminderCard = React.memo(function ReminderCard({ id, title, time, isCompleted, onComplete, onDelete, onEdit, householdId, assigneeId }: ReminderCardProps) {
    // Combine store selectors to reduce re-renders
    const { households, activeHouseholdId, userId, nagMember, snoozePresets } = useStore(state => ({
        households: state.households,
        activeHouseholdId: state.activeHouseholdId,
        userId: state.userId,
        nagMember: state.nagMember,
        snoozePresets: state.settings.snooze_presets_mins
    }));
    const currentHousehold = useMemo(() => households.find(h => h.id === activeHouseholdId), [households, activeHouseholdId]);
    const [sheetMode, setSheetMode] = useState<'actions' | 'snooze' | 'nudge' | null>(null);
    const checkScale = useRef(new Animated.Value(1)).current;
    const enterOpacity = useRef(new Animated.Value(0)).current;
    const enterTranslate = useRef(new Animated.Value(8)).current;
    const exitTranslate = useRef(new Animated.Value(0)).current;
    const exitOpacity = useRef(new Animated.Value(1)).current;
    const hasEntered = useRef(false);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        if (hasEntered.current) return;
        hasEntered.current = true;
        Animated.parallel([
            Animated.timing(enterOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(enterTranslate, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, [enterOpacity, enterTranslate]);

    useEffect(() => {
        if (isCompleted) {
            Animated.sequence([
                Animated.timing(checkScale, { toValue: 1.08, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(checkScale, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
        }
    }, [checkScale, isCompleted]);

    // Resolve Assignee - memoized to avoid recalculation
    const { assignee, assigneeName, isMe } = useMemo(() => {
        const assignee = householdId && assigneeId && currentHousehold?.members
            ? currentHousehold.members.find((m) => m.user_id === assigneeId)
            : null;

        // Fallback name logic: Profile name -> Profile email -> 'Unknown'
        const assigneeName = assignee?.profile?.full_name?.split(' ')[0]
            || assignee?.profile?.email?.split('@')[0]
            || 'Family Member';

        const isMe = assigneeId === userId;

        return { assignee, assigneeName, isMe };
    }, [householdId, assigneeId, currentHousehold, userId]);

    const showActionMenu = () => {
        Haptics.selectionAsync();
        setSheetMode('actions');
    };

    const formatSnoozeLabel = (minutes: number) => {
        if (minutes < 60) return `${minutes} minutes`;
        if (minutes === 60) return '1 hour';
        const hours = Math.round(minutes / 60);
        return `${hours} hours`;
    };

    const handleComplete = () => {
        console.log('ReminderCard: handleComplete called', { id, title, isCompleted });
        if (isCompleted || isRemoving) {
            console.log('ReminderCard: Already completed, returning');
            return; // Idempotency lock
        }
        console.log('ReminderCard: Calling onComplete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsRemoving(true);
        onComplete();
        Animated.parallel([
            Animated.timing(exitTranslate, { toValue: 40, duration: 220, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
            Animated.timing(exitOpacity, { toValue: 0, duration: 200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        ]).start(() => {
            setIsRemoving(false);
            exitTranslate.setValue(0);
            exitOpacity.setValue(1);
        });
    };

    return (
        <>
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: Animated.multiply(enterOpacity, exitOpacity),
                    transform: [
                        { translateY: enterTranslate },
                        { translateX: exitTranslate }
                    ]
                }
            ]}
        >
            <View style={styles.row}>
                {/* Main Tap Area: Complete Task */}
                <Pressable
                    onPress={handleComplete}
                    style={({ pressed }) => [
                        styles.mainTouchArea,
                        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                    ]}
                >
                    <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                        <View style={[styles.checkboxBase, isCompleted && styles.checkboxChecked]}>
                            {isCompleted && <Ionicons name="checkmark" size={16} color={Colors.dark.background} />}
                            {!isCompleted && <View style={styles.checkboxInner} />}
                        </View>
                    </Animated.View>

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
                                setSheetMode('nudge');
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
        </Animated.View>
        <BlurredBottomSheet
            visible={sheetMode !== null}
            onClose={() => setSheetMode(null)}
            title={
                sheetMode === 'actions' ? 'Task options' :
                sheetMode === 'snooze' ? 'Snooze until' :
                sheetMode === 'nudge' ? 'Nudge sent' :
                undefined
            }
            subtitle={
                sheetMode === 'actions' ? title :
                sheetMode === 'nudge' ? `${assigneeName} has been notified.` :
                undefined
            }
            actions={
                sheetMode === 'actions'
                    ? [
                        { label: 'Snooze', tone: 'accent', onPress: () => setSheetMode('snooze') },
                        { label: 'Edit details', onPress: () => { setSheetMode(null); onEdit(); } },
                        { label: 'Delete reminder', tone: 'destructive', onPress: () => { setSheetMode(null); onDelete(); } }
                    ]
                    : sheetMode === 'snooze'
                    ? [
                        ...snoozePresets.map((minutes) => ({
                            label: formatSnoozeLabel(minutes),
                            onPress: () => { setSheetMode(null); useStore.getState().snoozeReminder(id, minutes); }
                        })),
                        { label: 'Tomorrow', onPress: () => { setSheetMode(null); useStore.getState().snoozeReminder(id, 1440); } }
                    ]
                    : sheetMode === 'nudge'
                    ? [{ label: 'Done', onPress: () => setSheetMode(null) }]
                    : []
            }
        />
        </>
    );
});



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
