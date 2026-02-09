import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { Layout } from '../../src/components/Layout';
import { ReminderCard } from '../../src/components/ReminderCard';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { formatDueTime, isToday } from '../../src/utils/date';
import { ProductivityHeatmap } from '../../src/components/ProductivityHeatmap';
import { CategoryGrid } from '../../src/components/CategoryGrid';
import { ProBadge } from '../../src/components/ProBadge';

export default function TodayScreen() {
    const router = useRouter();
    const reminders = useStore(state => state.reminders);
    const userProfile = useStore(state => state.userProfile);
    const isPro = useStore(state => state.isPro);

    const sections = useMemo(() => {
        const now = Date.now();
        const activeReminders = reminders.filter(r => r.status === 'active' && !r.deleted_at);
        
        const today: typeof reminders = [];
        const overdue: typeof reminders = [];

        activeReminders.forEach(r => {
            const fireTime = new Date(r.next_fire_at).getTime();
            if (isToday(r.next_fire_at)) {
                today.push(r);
            } else if (fireTime < now) {
                overdue.push(r);
            }
        });

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
                contentContainerStyle={{ paddingBottom: 140 }}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.topRow}>
                            <View style={styles.greetingRow}>
                                <ThemedText variant="h1" weight="bold" style={styles.greeting}>Hey {firstName}</ThemedText>
                                {isPro && <ProBadge />}
                            </View>
                            <Pressable onPress={() => router.push('/account')} style={({ pressed }) => pressed && { transform: [{ scale: 0.96 }] }}>
                                <Ionicons name="person-circle-outline" size={34} color={Colors.dark.primary} />
                            </Pressable>
                        </View>
                        <ThemedText color={Colors.dark.textSecondary} style={styles.subhead}>
                            {sections.length === 0 ? "You're all caught up for today." : "Here's what's on your list."}
                        </ThemedText>
                        <ProductivityHeatmap />
                        <CategoryGrid />
                    </View>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <ThemedText variant="h2" weight="semibold" color={Colors.dark.textSecondary} style={styles.sectionHeader}>
                        {title}
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

            <Pressable
                style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.96 }] }]}
                onPress={() => router.push('/modal')}
            >
                <Ionicons name="add" size={28} color="white" />
            </Pressable>
        </Layout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 16,
        marginBottom: 18,
        paddingHorizontal: 6,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 14,
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    greeting: {
        fontSize: 38,
        letterSpacing: -0.5,
    },
    subhead: {
        paddingHorizontal: 14,
        marginBottom: 14,
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 10,
        marginLeft: 18,
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
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: Colors.dark.primaryVibrant,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: Colors.dark.glow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }
});
