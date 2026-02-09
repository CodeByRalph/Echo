import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BlurredBottomSheet } from '../../src/components/BlurredBottomSheet';
import { Button } from '../../src/components/Button';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { Household } from '../../src/types';
import { Avatar } from '../../src/components/Avatar';

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
    const [formError, setFormError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [proGate, setProGate] = useState(false);
    const [inviteSheet, setInviteSheet] = useState<Household | null>(null);
    const [leaveSheet, setLeaveSheet] = useState<Household | null>(null);

    const handleCreate = async () => {
        if (!householdName.trim()) {
            setFormError("Please enter a family name.");
            return;
        }
        await createHousehold(householdName);
        setHouseholdName('');
        setIsCreating(false);
        setNotice("Family space created.");
        setFormError(null);
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            setFormError("Please enter an invite code.");
            return;
        }
        try {
            await joinHousehold(inviteCode);
            setInviteCode('');
            setIsJoining(false);
            setNotice("You're in. Welcome to the space.");
            setFormError(null);
        } catch (e) {
            // Error is handled in store
        }
    };

    const renderHouseholdItem = ({ item }: { item: Household }) => {
        const isOwner = item.created_by === userId;
        const creatorName = isOwner ? "You" : (item.created_by_profile?.full_name || item.created_by_profile?.email || "Unknown");
        const members = item.members || [];
        const memberCount = members.length || 1;
        const memberAvatars = members.length > 0 ? members.slice(0, 3) : [{ user_id: 'owner', profile: { full_name: creatorName, email: creatorName } } as any];

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="home" size={24} color={Colors.dark.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <ThemedText variant="h3" weight="semibold">{item.name}</ThemedText>
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
                        <View style={styles.memberRow}>
                            <View style={styles.avatarStack}>
                                {memberAvatars.map((member, index) => (
                                    <View key={member.user_id} style={[styles.avatarWrap, index > 0 && { marginLeft: -10 }]}>
                                        <Avatar
                                            name={member.profile?.full_name || member.profile?.email || 'Member'}
                                            size={26}
                                            color={Colors.dark.primary}
                                        />
                                    </View>
                                ))}
                                {memberCount > memberAvatars.length && (
                                    <View style={styles.moreBadge}>
                                        <ThemedText variant="caption" weight="semibold">+{memberCount - memberAvatars.length}</ThemedText>
                                    </View>
                                )}
                            </View>
                            <View style={styles.activityDot} />
                            <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                                {memberCount} members
                            </ThemedText>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setLeaveSheet(item);
                        }}
                        style={styles.leaveButton}
                    >
                        <Ionicons name="log-out-outline" size={22} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                </View>

                {isOwner && (
                    <View style={styles.actions}>
                        <Button
                            title="Invite Member"
                            variant="secondary"
                            onPress={() => setInviteSheet(item)}
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
                <Ionicons name="people-circle-outline" size={46} color={Colors.dark.primary} />
                <ThemedText variant="h1" weight="bold" style={{ marginLeft: 12, letterSpacing: -0.4 }}>Family Spaces</ThemedText>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

                <ThemedText color={Colors.dark.textSecondary} style={{ marginBottom: 24 }}>
                    Sync reminders, assign tasks, and keep your household in the loop.
                </ThemedText>
                {notice && (
                    <View style={styles.notice}>
                        <ThemedText variant="caption" color={Colors.dark.textSecondary}>{notice}</ThemedText>
                    </View>
                )}

                {/* Actions Section First */}
                <View style={{ gap: 16, marginBottom: 32 }}>
                    {!isCreating && !isJoining && (
                        <>
                            <Button
                                title="Create New Family"
                                onPress={() => {
                                    if (!isPro && households.length >= 1) {
                                        setProGate(true);
                                    } else {
                                        setFormError(null);
                                        setNotice(null);
                                        setIsCreating(true);
                                    }
                                }}
                            />
                            <Button
                                title="Join Family"
                                variant="secondary"
                                onPress={() => {
                                    if (!isPro && households.length >= 1) {
                                        setProGate(true);
                                    } else {
                                        setFormError(null);
                                        setNotice(null);
                                        setIsJoining(true);
                                    }
                                }}
                            />
                        </>
                    )}

                    {isCreating && (
                        <View style={styles.formSection}>
                            <ThemedText variant="h2" weight="semibold" style={{ marginBottom: 14 }}>Create Space</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Family Name (e.g. The Smiths)"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={householdName}
                                onChangeText={setHouseholdName}
                                autoFocus
                            />
                            {formError && <ThemedText variant="caption" color={Colors.dark.textSecondary} style={{ marginBottom: 12 }}>{formError}</ThemedText>}
                            <View style={styles.buttonRow}>
                                <Button title="Cancel" variant="ghost" onPress={() => setIsCreating(false)} style={{ flex: 1 }} />
                                <Button title="Create" onPress={handleCreate} style={{ flex: 1 }} />
                            </View>
                        </View>
                    )}

                    {isJoining && (
                        <View style={styles.formSection}>
                            <ThemedText variant="h2" weight="semibold" style={{ marginBottom: 14 }}>Join Space</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Invite Code"
                                placeholderTextColor={Colors.dark.textMuted}
                                value={inviteCode}
                                onChangeText={setInviteCode}
                                autoCapitalize="none"
                                autoFocus
                            />
                            {formError && <ThemedText variant="caption" color={Colors.dark.textSecondary} style={{ marginBottom: 12 }}>{formError}</ThemedText>}
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
                        <ThemedText variant="label" color={Colors.dark.textSecondary} style={{ marginBottom: 12, letterSpacing: 1 }}>YOUR SPACES</ThemedText>
                        {households.map(h => (
                            <View key={h.id} style={{ marginBottom: 16 }}>
                                {renderHouseholdItem({ item: h })}
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>
            <BlurredBottomSheet
                visible={proGate}
                onClose={() => setProGate(false)}
                title="Echo Pro required"
                subtitle="Manage multiple families and unlock shared spaces."
                actions={[
                    { label: 'Not now', onPress: () => setProGate(false) },
                    { label: 'Upgrade', tone: 'accent', onPress: () => { setProGate(false); router.push('/paywall'); } }
                ]}
            />
            <BlurredBottomSheet
                visible={Boolean(inviteSheet)}
                onClose={() => setInviteSheet(null)}
                title="Invite code"
                subtitle="Share this code with your family."
                actions={[
                    {
                        label: 'Copy code',
                        tone: 'accent',
                        onPress: async () => {
                            if (inviteSheet?.invite_code) {
                                await Clipboard.setStringAsync(inviteSheet.invite_code);
                                setNotice('Invite code copied.');
                            }
                            setInviteSheet(null);
                        }
                    },
                    {
                        label: 'Share',
                        onPress: async () => {
                            if (inviteSheet?.invite_code) {
                                await Share.share({ message: `Join my family space with code: ${inviteSheet.invite_code}` });
                            }
                            setInviteSheet(null);
                        }
                    }
                ]}
            >
                <View style={styles.inviteCode}>
                    <ThemedText variant="h1" weight="bold" style={{ letterSpacing: 2 }}>
                        {inviteSheet?.invite_code || '----'}
                    </ThemedText>
                </View>
            </BlurredBottomSheet>
            <BlurredBottomSheet
                visible={Boolean(leaveSheet)}
                onClose={() => setLeaveSheet(null)}
                title={`Leave ${leaveSheet?.name || 'this space'}?`}
                subtitle="You can rejoin with an invite code."
                actions={[
                    { label: 'Stay', onPress: () => setLeaveSheet(null) },
                    {
                        label: 'Leave space',
                        tone: 'destructive',
                        onPress: async () => {
                            if (!leaveSheet) return;
                            await leaveHousehold(leaveSheet.id);
                            if (households.length === 1) router.replace('/');
                            setLeaveSheet(null);
                        }
                    }
                ]}
            />
        </Layout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 16,
        marginBottom: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },
    notice: {
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    card: {
        backgroundColor: Colors.dark.surfaceElevated,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: Colors.dark.shadow,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(147,197,253,0.12)',
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
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrap: {
        borderRadius: 13,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: Colors.dark.surface,
    },
    moreBadge: {
        marginLeft: -8,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.surfaceHighlight,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    activityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.success,
    },
    actions: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 14,
    },
    formSection: {
        backgroundColor: Colors.dark.surfaceElevated,
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: Colors.dark.text,
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    inviteCode: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    }
});
