import { Ionicons } from '@expo/vector-icons';
import { compareAsc, isPast, isToday, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { CategoryGrid } from '../../src/components/CategoryGrid';
import { EmptyState } from '../../src/components/EmptyState';
import { GreetingHeader } from '../../src/components/GreetingHeader';
import { Layout } from '../../src/components/Layout';
import { ProductivityHeatmap } from '../../src/components/ProductivityHeatmap';
import { ReminderCard } from '../../src/components/ReminderCard';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { Reminder } from '../../src/types';
import { formatDueTime } from '../../src/utils/date';

export default function TodayScreen() {
  const reminders = useStore((state) => state.reminders);
  const router = useRouter();

  const sections = useMemo(() => {
    const activeReminders = reminders.filter(r => r.status === 'active' && !r.deleted_at);

    const overdue: Reminder[] = [];
    const today: Reminder[] = [];
    const upcoming: Reminder[] = [];

    activeReminders.forEach(r => {
      const fireDate = parseISO(r.next_fire_at);

      // Filter out family reminders from "Today/Upcoming" as they are in the family folder
      if (r.household_id) return;

      // Only show tasks that are due (past or today)
      if (isPast(fireDate) && !isToday(fireDate)) {
        overdue.push(r);
      } else if (isToday(fireDate)) {
        today.push(r);
      } else {
        // Future tasks go to upcoming
        upcoming.push(r);
      }
    });

    const sortByDate = (a: Reminder, b: Reminder) => compareAsc(parseISO(a.next_fire_at), parseISO(b.next_fire_at));

    overdue.sort(sortByDate);
    today.sort(sortByDate);
    upcoming.sort(sortByDate);

    const result = [];
    if (overdue.length > 0) result.push({ title: 'Overdue', data: overdue, color: Colors.dark.error });
    if (today.length > 0) result.push({ title: 'Today', data: today, color: Colors.dark.primary });
    if (upcoming.length > 0) result.push({ title: 'Upcoming', data: upcoming, color: Colors.dark.textSecondary });

    return result;
  }, [reminders]);

  return (
    <Layout>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <GreetingHeader />
            <ProductivityHeatmap />
            <CategoryGrid />
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        renderSectionHeader={({ section: { title, color } }) => (
          <ThemedText
            variant="h2" // Larger header
            weight="bold"
            color={color}
            style={{ marginTop: 24, marginBottom: 8, marginLeft: 20 }}
          >
            {title}
          </ThemedText>
        )}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;

          return (
            <View style={{
              backgroundColor: Colors.dark.surface,
              marginHorizontal: 16,
              borderTopLeftRadius: isFirst ? 12 : 0,
              borderTopRightRadius: isFirst ? 12 : 0,
              borderBottomLeftRadius: isLast ? 12 : 0,
              borderBottomRightRadius: isLast ? 12 : 0,
              overflow: 'hidden',
            }}>
              {(() => {
                // All tasks are now one-time: completed if status='done'
                const isCompletedForCurrentOccurrence = item.status === 'done';

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
              })()}
              {!isLast && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.dark.border, marginLeft: 52 }} />}
            </View>
          );
        }}
        stickySectionHeadersEnabled={false}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/modal')}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>
    </Layout>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.primary, // System Blue
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.dark.primaryVibrant,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  }
});
