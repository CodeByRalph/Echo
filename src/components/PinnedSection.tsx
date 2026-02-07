import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useStore } from '../store/useStore';
import { Reminder } from '../types';
import { ThemedText } from './ThemedText';

export function PinnedSection() {
    const reminders = useStore((state) => state.reminders);
    // For MVP, "Pinned" could just be "High Priority" or manually flagged.
    // Let's assume we pin the next 3 upcoming tasks for now, or maybe specific "important" ones.
    // Ideally we add a 'isPinned' field later. For now, let's show the soonest 3 active reminders.
    const pinnedReminders = reminders
        .filter(r => r.status === 'active' && !r.deleted_at)
        .sort((a, b) => new Date(a.next_fire_at).getTime() - new Date(b.next_fire_at).getTime())
        .slice(0, 3);

    if (pinnedReminders.length === 0) return null;

    const PinnedCard = ({ item }: { item: Reminder }) => (
        <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="bookmark" size={20} color={Colors.dark.accent} />
                <ThemedText variant="caption" style={{ color: Colors.dark.textSecondary }}>
                    {new Date(item.next_fire_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
            </View>
            <ThemedText variant="body" weight="bold" numberOfLines={2} style={styles.title}>
                {item.title}
            </ThemedText>
            {item.notes && (
                <ThemedText variant="caption" numberOfLines={1} style={{ color: Colors.dark.textMuted }}>
                    {item.notes}
                </ThemedText>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ThemedText variant="h3" weight="bold" style={styles.header}>
                Pinned
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {pinnedReminders.map(r => (
                    <PinnedCard key={r.id} item={r} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    card: {
        width: 160,
        height: 140,
        backgroundColor: Colors.dark.surfaceHighlight, // Slightly lighter than background
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        marginTop: 8,
        flex: 1,
    }
});
