import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { Household } from '../../src/types';

export default function FamilySetupScreen() {
    const router = useRouter();
    const createHousehold = useStore((state) => state.createHousehold);
    const joinHousehold = useStore((state) => state.joinHousehold);
    const leaveHousehold = useStore((state) => state.leaveHousehold);
    const households = useStore((state) => state.households);
    const userId = useStore((state) => state.userId);
    const isPro = useStore((state) => state.isPro);

    const [householdName, setHouseholdName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!householdName.trim()) {
            Alert.alert("Required", "Please enter a family name.");
            return;
        }
        await createHousehold(householdName);
        setHouseholdName('');
        setIsCreating(false);
        Alert.alert("Success", "Family space created!");
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            Alert.alert("Required", "Please enter an invite code.");
            return;
        }
        try {
            await joinHousehold(inviteCode);
            setInviteCode('');
            setIsJoining(false);
            Alert.alert("Success", "You have joined the household!");
        } catch (e) {
            // Error is handled in store
        }
    };

    const renderHouseholdItem = ({ item }: { item: Household }) => {
        const isOwner = item.created_by === userId;
        const creatorName = isOwner ? "You" : (item.created_by_profile?.full_name || item.created_by_profile?.email || "Unknown");

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="home" size={24} color={Colors.dark.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ThemedText variant="h3" weight="bold">{item.name}</ThemedText>
                        <View style={styles.badgeRow}>
                            {isOwner && (
                                <View style={styles.ownerBadge}>
                                    <ThemedText variant="caption" color="white" weight="bold">OWNER</ThemedText>
                                </View>
                            )}
                            <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                                Created by {creatorName}
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert("Leave Family?", `Are you sure you want to leave ${item.name}?`, [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Leave", style: "destructive", onPress: async () => {
                                        await leaveHousehold(item.id);
                                        if (households.length === 1) router.replace('/');
                                    }
                                }
                            ]);
                        }}
                        style={styles.leaveButton}
                    >
                        <Ionicons name="log-out-outline" size={24} color={Colors.dark.error} />
                    </TouchableOpacity>
                </View>

                {isOwner && (
                    <View style={styles.actions}>
                        <Button
                            title="Invite Member"
                            variant="secondary"
                            onPress={() => Alert.alert("Invite", `Share this code: ${item.invite_code || 'Error: No Code'}`)}
                            style={{ flex: 1 }}
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <Layout>
            <View style={styles.header}>
                <Ionicons name="people-circle-outline" size={48} color={Colors.dark.primary} />
                <ThemedText variant="h1" weight="bold" style={{ marginLeft: 12 }}>Family Spaces</ThemedText>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                <ThemedText color={Colors.dark.textSecondary} style={{ marginBottom: 24 }}>
                    Sync reminders, assign tasks, and keep your household in the loop.
                </ThemedText>

                {/* Actions Section First */}
                <View style={{ gap: 16, marginBottom: 32 }}>
                    {!isCreating && !isJoining && (
                        <>
                            <Button
                                title="Create New Family"
                                onPress={() => {
                                    if (!isPro && households.length >= 1) {
                                        Alert.alert("Echo Pro Required", "Managing multiple families is a Pro feature.", [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Upgrade", onPress: () => router.push('/paywall') }
                                        ]);
                                    } else {
                                        setIsCreating(true);
                                    }
                                }}
                            />
                            <Button
                                title="Join Family"
                                variant="secondary"
                                onPress={() => {
                                    if (!isPro && households.length >= 1) {
                                        Alert.alert("Echo Pro Required", "Managing multiple families is a Pro feature.", [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Upgrade", onPress: () => router.push('/paywall') }
                                        ]);
                                    } else {
                                        setIsJoining(true);
                                    }
                                }}
                            />
                        </>
                    )}

                    {isCreating && (
                        <View style={styles.formSection}>
                            <ThemedText variant="h2" style={{ marginBottom: 16 }}>Create Space</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Family Name (e.g. The Smiths)"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={householdName}
                                onChangeText={setHouseholdName}
                                autoFocus
                            />
                            <View style={styles.buttonRow}>
                                <Button title="Cancel" variant="ghost" onPress={() => setIsCreating(false)} style={{ flex: 1 }} />
                                <Button title="Create" onPress={handleCreate} style={{ flex: 1 }} />
                            </View>
                        </View>
                    )}

                    {isJoining && (
                        <View style={styles.formSection}>
                            <ThemedText variant="h2" style={{ marginBottom: 16 }}>Join Space</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Invite Code"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="none"
                                autoFocus
                            />
                            <View style={styles.buttonRow}>
                                <Button title="Cancel" variant="ghost" onPress={() => setIsJoining(false)} style={{ flex: 1 }} />
                                <Button title="Join" onPress={handleJoin} style={{ flex: 1 }} />
                            </View>
                        </View>
                    )}

                </View>

                {/* Your Spaces Section Second */}
                {households.length > 0 && (
                    <View style={{ marginBottom: 32 }}>
                        <ThemedText variant="label" style={{ marginBottom: 12 }}>YOUR SPACES</ThemedText>
                        {households.map(h => (
                            <View key={h.id} style={{ marginBottom: 16 }}>
                                {renderHouseholdItem({ item: h })}
                            </View>
                        ))}
                    </View>
                )}

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
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.dark.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    ownerBadge: {
        backgroundColor: Colors.dark.accent,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    leaveButton: {
        padding: 8,
    },
    actions: {
        borderTopWidth: 1,
        borderTopColor: Colors.dark.surfaceHighlight,
        paddingTop: 12,
    },
    formSection: {
        backgroundColor: Colors.dark.surface,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    input: {
        backgroundColor: Colors.dark.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.dark.text,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    }
});
