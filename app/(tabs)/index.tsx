import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Layout } from '../../src/components/Layout';
import { ReminderCard } from '../../src/components/ReminderCard';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { formatDueTime, isToday } from '../../src/utils/date';

export default function TodayScreen() {
    const router = useRouter();
    const reminders = useStore(state => state.reminders);
    const userProfile = useStore(state => state.userProfile);

    const sections = useMemo(() => {
        const today = reminders.filter(r =>
            r.status === 'active' &&
            !r.deleted_at &&
            isToday(r.next_fire_at)
        );

        const overdue = reminders.filter(r =>
            r.status === 'active' &&
            !r.deleted_at &&
            new Date(r.next_fire_at).getTime() < new Date().getTime() &&
            !isToday(r.next_fire_at)
        );

        const result = [];
        if (overdue.length > 0) result.push({ title: 'Overdue', data: overdue });
        if (today.length > 0) result.push({ title: 'Today', data: today });

        return result;
    }, [reminders]);

    const firstName = userProfile?.full_name?.split(' ')[0] || 'there';

    return (
        <Layout>
            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.topRow}>
                            <ThemedText variant="h1" weight="bold">Hey {firstName}</ThemedText>
                            <TouchableOpacity onPress={() => router.push('/account')}>
                                <Ionicons name="person-circle-outline" size={32} color={Colors.dark.primary} />
                            </TouchableOpacity>
                        </View>
                        <ThemedText color={Colors.dark.textSecondary}>
                            {sections.length === 0 ? "You're all caught up for today!" : "Here's what's on your list."}
                        </ThemedText>
                    </View>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={styles.sectionHeader}>
                        {title.toUpperCase()}
                    </ThemedText>
                )}
                renderItem={({ item }) => (
                    <ReminderCard
                        id={item.id}
                        title={item.title}
                        time={formatDueTime(item.next_fire_at)}
                        isCompleted={false}
                        onComplete={() => useStore.getState().completeReminder(item.id)}
                        onDelete={() => useStore.getState().deleteReminder(item.id)}
                        onEdit={() => router.push({ pathname: '/modal', params: { id: item.id } })}
                        householdId={item.household_id || undefined}
                        assigneeId={item.assignee_id || undefined}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-circle-outline" size={64} color={Colors.dark.surfaceHighlight} />
                        <ThemedText color={Colors.dark.textMuted} style={{ marginTop: 16 }}>No reminders for today.</ThemedText>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/modal')}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </Layout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 20,
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionHeader: {
        marginTop: 16,
        marginBottom: 8,
        marginLeft: 20,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    }
});
