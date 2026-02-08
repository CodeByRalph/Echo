import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { useStore } from '../src/store/useStore';

export default function SnoozeSettingsScreen() {
    const router = useRouter();
    const settings = useStore((state) => state.settings);
    const updateSettings = useStore((state) => state.updateSettings);
    const isPro = useStore((state) => state.isPro);

    // Local state for adding new preset
    const [newPreset, setNewPreset] = useState('');

    const presets = settings.snooze_presets_mins || [10, 60, 1440];

    const handleAddPreset = () => {
        if (!isPro) return; // Should be blocked by entry, but safe guard

        const mins = parseInt(newPreset, 10);
        if (isNaN(mins) || mins <= 0) {
            Alert.alert("Invalid Input", "Please enter a positive number of minutes.");
            return;
        }

        if (presets.includes(mins)) {
            Alert.alert("Duplicate", "This preset already exists.");
            return;
        }

        const newPresets = [...presets, mins].sort((a, b) => a - b);
        updateSettings({ snooze_presets_mins: newPresets });
        setNewPreset('');
    };

    const handleDeletePreset = (val: number) => {
        if (presets.length <= 1) {
            Alert.alert("Cannot Remove", "You must have at least one snooze option.");
            return;
        }
        const newPresets = presets.filter(p => p !== val);
        updateSettings({ snooze_presets_mins: newPresets });
    };

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins}m`;
        if (mins % 60 === 0) return `${mins / 60}h`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    if (!isPro) {
        // Redundant safety if they navigate here manually
        return (
            <Layout>
                <View style={styles.center}>
                    <ThemedText>Pro-only feature.</ThemedText>
                    <TouchableOpacity onPress={() => router.replace('/paywall')}>
                        <ThemedText color={Colors.dark.primary}>Upgrade</ThemedText>
                    </TouchableOpacity>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="chevron-back" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
                <ThemedText variant="h1" weight="bold">Snooze Settings</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <ThemedText color={Colors.dark.textSecondary} style={{ marginBottom: 24 }}>
                    Customize the quick snooze options that appear when you delay a reminder.
                </ThemedText>

                <View style={styles.list}>
                    {presets.map((mins) => (
                        <View key={mins} style={styles.item}>
                            <View style={styles.itemLeft}>
                                <Ionicons name="time-outline" size={20} color={Colors.dark.text} />
                                <ThemedText style={{ marginLeft: 12, fontSize: 16 }}>{formatDuration(mins)}</ThemedText>
                                <ThemedText variant="caption" color={Colors.dark.textMuted} style={{ marginLeft: 8 }}>({mins} min)</ThemedText>
                            </View>
                            <TouchableOpacity onPress={() => handleDeletePreset(mins)} style={styles.deleteButton}>
                                <Ionicons name="trash-outline" size={20} color={Colors.dark.error} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.addSection}>
                    <ThemedText variant="h3" style={{ marginBottom: 12 }}>Add Preset</ThemedText>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="Minutes (e.g. 30)"
                            placeholderTextColor={Colors.dark.textMuted}
                            keyboardType="number-pad"
                            value={newPreset}
                            onChangeText={setNewPreset}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={handleAddPreset}>
                            <ThemedText weight="bold" color="white">Add</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
        marginTop: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        paddingBottom: 40,
    },
    list: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 32,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark.surfaceHighlight,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 8,
    },
    addSection: {

    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.dark.text,
        fontSize: 16,
    },
    addButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
