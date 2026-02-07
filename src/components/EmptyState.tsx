import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

export function EmptyState() {
    return (
        <View style={styles.container}>
            <Ionicons name="checkmark-circle-outline" size={64} color={Colors.dark.textMuted} style={{ marginBottom: 16 }} />
            <ThemedText variant="h3" weight="bold" style={{ marginBottom: 4 }}>
                No Reminders
            </ThemedText>
            <ThemedText color={Colors.dark.textSecondary} style={{ textAlign: 'center' }}>
                You have no reminders for today.
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    }
});
