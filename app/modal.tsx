import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
    const [dueTime, setDueTime] = useState(reminder ? new Date(reminder.next_fire_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '12:00');
    const [categoryId, setCategoryId] = useState<string | undefined>(reminder?.category_id || store.categories[0]?.id);
    const [householdId, setHouseholdId] = useState<string | undefined>(reminder?.household_id || undefined);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Required", "Please enter a title.");
            return;
        }

        // Parse time
        const [hours, minutes] = dueTime.split(':').map(Number);
        const nextFire = new Date();
        nextFire.setHours(hours, minutes, 0, 0);
        if (nextFire < new Date()) nextFire.setDate(nextFire.getDate() + 1);

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
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>WHAT'S THE TASK?</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Call Mom"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={title}
                        onChangeText={setTitle}
                        autoFocus
                    />
                </View>

                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>TIME</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="12:00"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={dueTime}
                        onChangeText={setDueTime}
                    />
                </View>

                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 12 }}>CATEGORY</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                        {store.categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryBadge,
                                    categoryId === cat.id && { backgroundColor: cat.color + '40' },
                                    categoryId === cat.id && { borderColor: cat.color }
                                ]}
                                onPress={() => setCategoryId(cat.id)}
                            >
                                <Ionicons name={cat.icon as any || 'folder-outline'} size={18} color={cat.color} />
                                <ThemedText style={{ marginLeft: 6, color: cat.color }}>{cat.name}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {store.households.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText variant="label" style={{ marginBottom: 12 }}>SHARE WITH FAMILY?</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                            <TouchableOpacity
                                style={[
                                    styles.categoryBadge,
                                    householdId === undefined && { backgroundColor: Colors.dark.surfaceHighlight },
                                ]}
                                onPress={() => setHouseholdId(undefined)}
                            >
                                <ThemedText color={householdId === undefined ? Colors.dark.text : Colors.dark.textSecondary}>Private</ThemedText>
                            </TouchableOpacity>
                            {store.households.map(h => (
                                <TouchableOpacity
                                    key={h.id}
                                    style={[
                                        styles.categoryBadge,
                                        householdId === h.id && { backgroundColor: Colors.dark.primary + '40' },
                                        householdId === h.id && { borderColor: Colors.dark.primary }
                                    ]}
                                    onPress={() => setHouseholdId(h.id)}
                                >
                                    <Ionicons name="home-outline" size={18} color={householdId === h.id ? Colors.dark.primary : Colors.dark.textSecondary} />
                                    <ThemedText style={{ marginLeft: 6, color: householdId === h.id ? Colors.dark.primary : Colors.dark.textSecondary }}>{h.name}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{ marginTop: 24 }}>
                    <Button title={id ? "Save Changes" : "Add Reminder"} onPress={handleSave} />
                    <Button title="Cancel" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
                </View>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        color: Colors.dark.text,
        fontSize: 18,
    },
    categoryRow: {
        flexDirection: 'row',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
        marginRight: 10,
    }
});
