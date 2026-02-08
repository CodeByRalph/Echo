import { Ionicons } from '@expo/vector-icons';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { useStore } from '../src/store/useStore';
import { Reminder } from '../src/types';

export default function ModalScreen() {
    const params = useLocalSearchParams();
    const id = typeof params.id === 'string' ? params.id : undefined;

    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

    const addReminder = useStore((state) => state.addReminder);
    const updateReminder = useStore((state) => state.updateReminder);
    const reminders = useStore((state) => state.reminders);
    const categories = useStore((state) => state.categories);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            const reminder = reminders.find(r => r.id === id);
            if (reminder) {
                setTitle(reminder.title);
                setNotes(reminder.notes || '');
                setDate(new Date(reminder.due_at));
                setSelectedCategoryId(reminder.category_id);
            }
        }
    }, [id]);

    const handleSave = () => {
        if (!title.trim()) return;

        const payload: Partial<Reminder> & { status?: string, version?: number } = {
            title,
            notes,
            due_at: date.toISOString(),
            next_fire_at: date.toISOString(),
            recurrence: { type: 'none', interval: 1 },
            // If family selected, set household_id, else set category_id
            household_id: selectedCategoryId === 'family-household' ? useStore.getState().currentHousehold?.id : undefined,
            category_id: selectedCategoryId === 'family-household' ? undefined : selectedCategoryId,
        };

        if (id) {
            updateReminder(id, payload);
        } else {
            addReminder({
                ...payload,
                status: 'active',
                recurrence: { type: 'none', interval: 1 }, // Type fix
                version: 1,
            } as any);
        }

        router.back();
    };

    return (
        <Layout>
            <ScrollView contentContainerStyle={{ paddingVertical: 24, gap: 24 }}>

                <View>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>What needs doing?</ThemedText>
                    <Input
                        placeholder="Buy groceries..."
                        value={title}
                        onChangeText={setTitle}
                    />
                    <Input
                        placeholder="Notes (optional)"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />
                </View>

                <View>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>When?</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <RNDateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={(e, d) => d && setDate(d)}
                            themeVariant="dark"
                            style={{ flex: 1 }}
                        />
                        <RNDateTimePicker
                            value={date}
                            mode="time"
                            display="default"
                            onChange={(e, d) => d && setDate(d)}
                            themeVariant="dark"
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>

                <View>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>List</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {/* Family Space Option */}
                        {useStore((state) => state.currentHousehold) && (
                            <TouchableOpacity
                                key="family-household"
                                onPress={() => setSelectedCategoryId('family-household')}
                                style={[
                                    styles.chip,
                                    selectedCategoryId === 'family-household' && { backgroundColor: Colors.dark.accent, borderColor: Colors.dark.accent },
                                ]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="people" size={16} color={selectedCategoryId === 'family-household' ? 'white' : Colors.dark.accent} style={{ marginRight: 6 }} />
                                    <ThemedText style={{ color: selectedCategoryId === 'family-household' ? 'white' : Colors.dark.textSecondary }}>
                                        {useStore((state) => state.currentHousehold)!.name}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        )}

                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategoryId(cat.id)}
                                style={[
                                    styles.chip,
                                    selectedCategoryId === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                                    !selectedCategoryId && cat.isDefault && cat.id === 'default-work' && { borderColor: 'transparent' }
                                ]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name={cat.icon as any} size={16} color={selectedCategoryId === cat.id ? 'white' : cat.color} style={{ marginRight: 6 }} />
                                    <ThemedText style={{ color: selectedCategoryId === cat.id ? 'white' : Colors.dark.textSecondary }}>
                                        {cat.name}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={{ marginTop: 32, gap: 12 }}>
                    <Button title={id ? "Save Changes" : "Create Reminder"} onPress={handleSave} />
                    <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
                </View>

            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.dark.surfaceHighlight,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
    }
});
