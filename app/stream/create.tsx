import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { RecurrenceConfig } from '../../src/types';

interface NewStreamItem {
    id: string; // Temp ID
    title: string;
    day_offset: number;
    time_of_day: string; // "HH:MM"
}

export default function CreateStreamScreen() {
    const router = useRouter();
    const createStream = useStore((state) => state.createStream);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<NewStreamItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Item input state
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemDay, setNewItemDay] = useState('0');
    const [newItemTime, setNewItemTime] = useState('09:00');

    const handleAddItem = () => {
        if (!newItemTitle.trim()) {
            Alert.alert('Validation Check', 'Please enter a title for the item.');
            return;
        }

        const day = parseInt(newItemDay);
        if (isNaN(day) || day < 0) {
            Alert.alert('Validation Check', 'Day offset must be a non-negative number.');
            return;
        }

        // Basic time validation
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(newItemTime)) {
            Alert.alert('Validation Check', 'Time must be in HH:MM format (e.g. 09:00 or 23:30).');
            return;
        }

        setItems([...items, {
            id: Math.random().toString(),
            title: newItemTitle,
            day_offset: day,
            time_of_day: newItemTime,
        }]);

        // Reset inputs
        setNewItemTitle('');
        // Keep day/time as they might want similar ones
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            Alert.alert('Validation Check', 'Please enter a stream title.');
            return;
        }
        if (items.length === 0) {
            Alert.alert('Validation Check', 'Please add at least one item to the routine.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert temp items to expected format
            const streamItems = items.map(item => ({
                title: item.title,
                recurrence_rule: { type: 'none' } as RecurrenceConfig, // Simplification for now
                day_offset: item.day_offset,
                time_of_day: item.time_of_day
            }));

            await createStream(title, description, streamItems);
            Alert.alert("Success", "Stream published successfully!");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create stream. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="close" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
                <ThemedText variant="h1" weight="bold">New Stream</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <ThemedText variant="h3" weight="bold" style={styles.sectionTitle}>Details</ThemedText>

                <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Title</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Morning Focus Protocol"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <ThemedText style={styles.label}>Description</ThemedText>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="What is this routine for?"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                <ThemedText variant="h3" weight="bold" style={styles.sectionTitle}>Items</ThemedText>

                {items.length > 0 && (
                    <View style={styles.itemsList}>
                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemRow}>
                                <View style={styles.itemIndex}>
                                    <ThemedText weight="bold" color={Colors.dark.background}>{index + 1}</ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText weight="medium">{item.title}</ThemedText>
                                    <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                                        Day {item.day_offset + 1} @ {item.time_of_day}
                                    </ThemedText>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={{ padding: 8 }}>
                                    <Ionicons name="trash-outline" size={20} color={Colors.dark.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.addItemForm}>
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Item Title</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Drink Water"
                            placeholderTextColor={Colors.dark.textMuted}
                            value={newItemTitle}
                            onChangeText={setNewItemTitle}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <ThemedText style={styles.label}>Day Offset (0=Day 1)</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={newItemDay}
                                onChangeText={setNewItemDay}
                                keyboardType="number-pad"
                            />
                        </View>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <ThemedText style={styles.label}>Time (HH:MM)</ThemedText>
                            <TextInput
                                style={styles.input}
                                value={newItemTime}
                                onChangeText={setNewItemTime}
                            />
                        </View>
                    </View>
                    <Button title="Add Item" onPress={handleAddItem} variant="secondary" />
                </View>

                <View style={styles.footer}>
                    <Button title={isSubmitting ? "Publishing..." : "Publish Stream"} onPress={handleSubmit} isLoading={isSubmitting} />
                </View>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        paddingBottom: 40,
    },
    sectionTitle: {
        marginBottom: 16,
        marginTop: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
        color: Colors.dark.text,
        fontSize: 16,
    },
    textArea: {
        height: 100,
    },
    itemsList: {
        marginBottom: 24,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    itemIndex: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    addItemForm: {
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
        borderStyle: 'dashed',
        marginBottom: 32,
    },
    footer: {
        marginBottom: 20,
    }
});
