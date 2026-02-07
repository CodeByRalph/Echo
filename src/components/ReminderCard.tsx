import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface ReminderCardProps {
    id: string;
    title: string;
    time: string;
    isCompleted?: boolean;
    onComplete: () => void;
    onDelete: () => void;
    onEdit: () => void;
}

export function ReminderCard({ id, title, time, isCompleted, onComplete, onDelete, onEdit }: ReminderCardProps) {

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
                    { text: 'Edit', onPress: onEdit },
                    { text: 'Delete', onPress: onDelete, style: 'destructive' },
                ]
            );
        }
    };

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
    }
});
