import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { Layout } from '../../src/components/Layout';
import { ReminderCard } from '../../src/components/ReminderCard';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { formatDueTime } from '../../src/utils/date';

export default function CategoryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const categories = useStore(state => state.categories);
    const reminders = useStore(state => state.reminders);
    const households = useStore(state => state.households);
    const activeHouseholdId = useStore(state => state.activeHouseholdId);
    const currentHousehold = households.find(h => h.id === activeHouseholdId);

    let category = categories.find(c => c.id === id);
    let categoryReminders = [];

    if (id === 'family-household' && currentHousehold) {
        // Virtual Category for Family
        category = {
            id: 'family-household',
            name: currentHousehold.name,
            color: Colors.dark.accent,
            icon: 'people',
            isDefault: false
        };
        categoryReminders = reminders.filter(r =>
            r.household_id === currentHousehold.id &&
            r.status === 'active' &&
            !r.deleted_at
        );
    } else {
        // Standard Category
        categoryReminders = reminders.filter(r =>
            r.category_id === id &&
            r.status === 'active' &&
            !r.deleted_at
        );
    }

    if (!category) {
        return (
            <Layout>
                <View style={styles.center}>
                    <ThemedText>Category not found</ThemedText>
                    <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
                        <ThemedText color={Colors.dark.primary}>Go Back</ThemedText>
                    </Pressable>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark.primary} />
                    <ThemedText color={Colors.dark.primary} style={{ marginLeft: 4 }}>Back</ThemedText>
                </Pressable>
                <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={24} color="white" />
                </View>
                <ThemedText variant="h1" weight="bold" style={{ color: category.color }}>
                    {category.name}
                </ThemedText>
            </View>

            <FlatList
                data={categoryReminders}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<EmptyState />}
                renderItem={({ item }) => {
                    // For recurring tasks: completed if last_action='done' AND next occurrence is in the future
                    // For one-time tasks: completed if status='done'
                    const isCompletedForCurrentOccurrence = item.recurrence.type !== 'none'
                        ? item.last_action === 'done' && new Date(item.next_fire_at).getTime() > Date.now()
                        : item.status === 'done';

                    return (
                        <ReminderCard
                            id={item.id}
                            title={item.title}
                            time={formatDueTime(item.next_fire_at)}
                            isCompleted={isCompletedForCurrentOccurrence}
                            onComplete={() => useStore.getState().completeReminder(item.id)}
                            onDelete={() => useStore.getState().deleteReminder(item.id)}
                            onEdit={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                            householdId={item.household_id}
                            assigneeId={item.assignee_id}
                        />
                    );
                }}
            />
        </Layout>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    }
});
