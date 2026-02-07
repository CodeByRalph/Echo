import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../src/components/Button';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { useStore } from '../src/store/useStore';

export default function SnoozeSettingsScreen() {
    const router = useRouter();
    const settings = useStore((state) => state.settings);
    const updateSettings = useStore((state) => state.updateSettings);

    const [preset1, setPreset1] = useState(settings.snooze_presets_mins[0].toString());
    const [preset2, setPreset2] = useState(settings.snooze_presets_mins[1].toString());
    const [preset3, setPreset3] = useState(settings.snooze_presets_mins[2].toString());

    const handleSave = () => {
        const v1 = parseInt(preset1, 10);
        const v2 = parseInt(preset2, 10);
        const v3 = parseInt(preset3, 10);

        if (isNaN(v1) || IsNaN(v2) || isNaN(v3) || v1 <= 0 || v2 <= 0 || v3 <= 0) {
            Alert.alert("Invalid Input", "Please enter valid positive numbers for all presets.");
            return;
        }

        updateSettings({ snooze_presets_mins: [v1, v2, v3] });
        router.back();
    };

    // Helper workaround for isNaN type check if strict
    function IsNaN(v: number) { return isNaN(v); }

    const PresetInput = ({ label, value, onChange }: { label: string, value: string, onChange: (t: string) => void }) => (
        <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.dark.textMuted}
                />
                <ThemedText style={styles.suffix}>min</ThemedText>
            </View>
        </View>
    );

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="close" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
                <ThemedText variant="h1" weight="bold">Snooze Presets</ThemedText>
            </View>

            <View style={styles.content}>
                <ThemedText color={Colors.dark.textSecondary} style={{ marginBottom: 32 }}>
                    Customize the three quick-snooze options available in notifications and the app.
                </ThemedText>

                <PresetInput label="Short Snooze (Option 1)" value={preset1} onChange={setPreset1} />
                <PresetInput label="Medium Snooze (Option 2)" value={preset2} onChange={setPreset2} />
                <PresetInput label="Long Snooze (Option 3)" value={preset3} onChange={setPreset3} />

                <View style={{ flex: 1 }} />
                <Button title="Save Changes" onPress={handleSave} />
            </View>
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
        flex: 1,
        paddingHorizontal: 8,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        marginBottom: 8,
        color: Colors.dark.textSecondary,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    input: {
        flex: 1,
        color: Colors.dark.text,
        fontSize: 18,
        padding: 0,
    },
    suffix: {
        color: Colors.dark.textMuted,
        marginLeft: 8,
    }
});
