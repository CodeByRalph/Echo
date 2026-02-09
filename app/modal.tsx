import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { useStore } from '../src/store/useStore';

export default function ReminderModal() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const store = useStore();
    const reminder = id ? store.reminders.find(r => r.id === id) : null;

    const [title, setTitle] = useState(reminder?.title || '');
    const [dueDate, setDueDate] = useState(reminder ? new Date(reminder.next_fire_at) : new Date());
    const [categoryId, setCategoryId] = useState<string | undefined>(reminder?.category_id || store.categories[0]?.id);
    const [householdId, setHouseholdId] = useState<string | undefined>(reminder?.household_id || undefined);
    const [titleError, setTitleError] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const formattedDate = useMemo(
        () => dueDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        [dueDate]
    );
    const formattedTime = useMemo(
        () => dueDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        [dueDate]
    );

    const handleSave = async () => {
        if (!title.trim()) {
            setTitleError(true);
            return;
        }
        setTitleError(false);

        const nextFire = new Date(dueDate);

        if (id) {
            store.updateReminder(id, {
                title,
                next_fire_at: nextFire.toISOString(),
                category_id: categoryId,
                household_id: householdId
            });
        } else {
            store.addReminder({
                title,
                due_at: nextFire.toISOString(),
                next_fire_at: nextFire.toISOString(),
                category_id: categoryId || store.categories[0]?.id,
                household_id: householdId,
                recurrence: { type: 'none' },
                status: 'active',
                version: 1,
                snooze_count: 0
            });
        }
        router.back();
    };

    return (
        <Layout>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={{ marginBottom: 8, letterSpacing: 0.6 }}>WHAT&apos;S THE TASK?</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Call Mom"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={title}
                        onChangeText={(value) => {
                            setTitle(value);
                            if (titleError) setTitleError(false);
                        }}
                        autoFocus
                    />
                    {titleError && (
                        <ThemedText variant="caption" color={Colors.dark.textSecondary} style={{ marginTop: 8 }}>
                            Add a short title to continue.
                        </ThemedText>
                    )}
                </View>

                <View style={styles.section}>
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={{ marginBottom: 8, letterSpacing: 0.6 }}>WHEN</ThemedText>
                    <View style={styles.pillRow}>
                        <Pressable style={styles.pill} onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={16} color={Colors.dark.textSecondary} />
                            <ThemedText style={{ marginLeft: 8 }}>{formattedDate}</ThemedText>
                        </Pressable>
                        <Pressable style={styles.pill} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={16} color={Colors.dark.textSecondary} />
                            <ThemedText style={{ marginLeft: 8 }}>{formattedTime}</ThemedText>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={{ marginBottom: 12, letterSpacing: 0.6 }}>LIST</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                        {store.categories.map(cat => (
                            <Pressable
                                key={cat.id}
                                style={({ pressed }) => [
                                    styles.categoryBadge,
                                    categoryId === cat.id && { backgroundColor: cat.color + '40' },
                                    categoryId === cat.id && { borderColor: cat.color },
                                    pressed && { transform: [{ scale: 0.98 }] }
                                ]}
                                onPress={() => setCategoryId(cat.id)}
                            >
                                <Ionicons name={cat.icon as any || 'folder-outline'} size={18} color={cat.color} />
                                <ThemedText style={{ marginLeft: 6, color: cat.color }}>{cat.name}</ThemedText>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {store.households.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText variant="label" color={Colors.dark.textSecondary} style={{ marginBottom: 12, letterSpacing: 0.6 }}>SHARE WITH FAMILY</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.categoryBadge,
                                    householdId === undefined && { backgroundColor: Colors.dark.surfaceHighlight },
                                    pressed && { transform: [{ scale: 0.98 }] }
                                ]}
                                onPress={() => setHouseholdId(undefined)}
                            >
                                <ThemedText color={householdId === undefined ? Colors.dark.text : Colors.dark.textSecondary}>Private</ThemedText>
                            </Pressable>
                            {store.households.map(h => (
                                <Pressable
                                    key={h.id}
                                    style={({ pressed }) => [
                                        styles.categoryBadge,
                                        householdId === h.id && { backgroundColor: Colors.dark.primary + '40' },
                                        householdId === h.id && { borderColor: Colors.dark.primary },
                                        pressed && { transform: [{ scale: 0.98 }] }
                                    ]}
                                    onPress={() => setHouseholdId(h.id)}
                                >
                                    <Ionicons name="home-outline" size={18} color={householdId === h.id ? Colors.dark.primary : Colors.dark.textSecondary} />
                                    <ThemedText style={{ marginLeft: 6, color: householdId === h.id ? Colors.dark.primary : Colors.dark.textSecondary }}>{h.name}</ThemedText>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{ marginTop: 24 }}>
                    <Button
                        title={id ? "Save Changes" : "Add Reminder"}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                            handleSave();
                        }}
                        style={styles.cta}
                    />
                    <Button title="Cancel" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
                </View>
            </ScrollView>
            {showDatePicker && (
                <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            const updated = new Date(dueDate);
                            updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                            setDueDate(updated);
                        }
                    }}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={dueDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowTimePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            const updated = new Date(dueDate);
                            updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                            setDueDate(updated);
                        }
                    }}
                />
            )}
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 18,
    },
    section: {
        marginBottom: 18,
    },
    input: {
        backgroundColor: Colors.dark.surfaceElevated,
        borderRadius: 16,
        padding: 16,
        color: Colors.dark.text,
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    categoryRow: {
        flexDirection: 'row',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginRight: 10,
    },
    pillRow: {
        flexDirection: 'row',
        gap: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: Colors.dark.surfaceElevated,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    cta: {
        shadowColor: Colors.dark.glow,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    }
});
