import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { Layout } from '../../src/components/Layout';
import { ReminderCard } from '../../src/components/ReminderCard';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { formatDueTime } from '../../src/utils/date';

export default function AllScreen() {
    const reminders = useStore(state => state.reminders);

    const sections = useMemo(() => {
        const active = reminders.filter(r => r.status === 'active' && !r.deleted_at);
        const completed = reminders.filter(r => r.status === 'done' && !r.deleted_at);

        // Sort by date descending for completed (history), ascending for active
        completed.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        active.sort((a, b) => new Date(a.next_fire_at).getTime() - new Date(b.next_fire_at).getTime());

        const result = [];
        if (active.length > 0) result.push({ title: 'Active', data: active });
        if (completed.length > 0) result.push({ title: 'Completed', data: completed });

        return result;
    }, [reminders]);

    return (
        <Layout>
            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={Colors.dark.primary} />
                            <ThemedText color={Colors.dark.primary} style={{ marginLeft: 4 }}>Back</ThemedText>
                        </Pressable>
                        <ThemedText variant="h1" weight="bold">History</ThemedText>
                    </View>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <ThemedText variant="h2" weight="semibold" color={Colors.dark.textSecondary} style={styles.sectionHeader}>
                        {title}
                    </ThemedText>
                )}
                renderItem={({ item, section }) => (
                    <ReminderCard
                        id={item.id}
                        title={item.title}
                        time={formatDueTime(item.next_fire_at)}
                        isRecurring={item.recurrence.type !== 'none'}
                        isCompleted={item.status === 'done' || item.status === 'completed'}
                        onComplete={() => useStore.getState().completeReminder(item.id)}
                        onDelete={() => useStore.getState().deleteReminder(item.id)}
                        onEdit={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                    />
                )}
            />
        </Layout>
    );
}


const styles = StyleSheet.create({
    header: {
        marginTop: 16,
        marginBottom: 18,
        paddingHorizontal: 12,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 10,
        marginLeft: 18,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.dark.surface,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12
    },
    itemCompleted: {
        opacity: 0.7,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.dark.surface,
    }
});
