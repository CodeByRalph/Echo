import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';

export default function FamilySetupScreen() {
    const router = useRouter();
    const createHousehold = useStore((state) => state.createHousehold);
    const joinHousehold = useStore((state) => state.joinHousehold);
    const currentHousehold = useStore((state) => state.currentHousehold);

    const [householdName, setHouseholdName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    const handleCreate = async () => {
        if (!householdName.trim()) {
            Alert.alert("Required", "Please enter a family name.");
            return;
        }
        await createHousehold(householdName);
        Alert.alert("Success", "Welcome to your family space!", [
            { text: "OK", onPress: () => router.back() }
        ]);
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            Alert.alert("Required", "Please enter an invite code.");
            return;
        }
        try {
            await joinHousehold(inviteCode);
            Alert.alert("Success", "You have joined the household!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (e) {
            // Error is handled in store, but we catch here to prevent success alert
        }
    };

    if (currentHousehold) {
        return (
            <Layout>
                <View style={styles.center}>
                    <Ionicons name="home" size={64} color={Colors.dark.primary} />
                    <ThemedText variant="h1" style={{ marginTop: 16 }}>{currentHousehold.name}</ThemedText>
                    <ThemedText color={Colors.dark.textSecondary} style={{ textAlign: 'center', marginTop: 8 }}>
                        You are part of this family space.
                    </ThemedText>

                    <View style={{ marginTop: 32, width: '100%', gap: 12 }}>
                        {/* Only show invite to admin */}
                        {currentHousehold.created_by === useStore.getState().userId && (
                            <Button
                                title="Invite Member"
                                onPress={() => Alert.alert("Invite", `Share this code: ${currentHousehold.invite_code || 'Error: No Code'}`)}
                            />
                        )}

                        <Button
                            title="Leave Family"
                            variant="secondary"
                            onPress={() => {
                                Alert.alert("Leave Family?", "Are you sure you want to leave this family space?", [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Leave", style: "destructive", onPress: async () => {
                                            await useStore.getState().leaveHousehold();
                                            router.replace('/');
                                        }
                                    }
                                ]);
                            }}
                        />
                    </View>
                </View>
            </Layout>
        )
    }

    return (
        <Layout>
            <View style={styles.header}>
                <Ionicons name="people-circle-outline" size={48} color={Colors.dark.primary} />
                <ThemedText variant="h1" weight="bold" style={{ marginLeft: 12 }}>Family Loop</ThemedText>
            </View>

            <ThemedText color={Colors.dark.textSecondary} style={{ marginBottom: 32 }}>
                Sync reminders, assign tasks, and keep your household in the loop.
            </ThemedText>

            <View style={styles.section}>
                <ThemedText variant="h2" style={{ marginBottom: 12 }}>Create a New Space</ThemedText>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. The Smiths"
                    placeholderTextColor={Colors.dark.textMuted}
                    value={householdName}
                    onChangeText={setHouseholdName}
                />
                <Button title="Create Family Space" onPress={handleCreate} />
            </View>

            <View style={styles.divider}>
                <View style={styles.line} />
                <ThemedText style={{ marginHorizontal: 12, color: Colors.dark.textMuted }}>OR</ThemedText>
                <View style={styles.line} />
            </View>

            <View style={styles.section}>
                <ThemedText variant="h2" style={{ marginBottom: 12 }}>Join Existing</ThemedText>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Invite Code"
                    placeholderTextColor={Colors.dark.textMuted}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                />
                <Button title="Join with Code" variant="secondary" onPress={handleJoin} />
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        color: Colors.dark.text,
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.dark.surfaceHighlight,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    }
});
