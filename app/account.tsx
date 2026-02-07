import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { useStore } from '../src/store/useStore';

export default function SettingsScreen() {
    const router = useRouter();
    const signOut = useStore((state) => state.signOut);
    const userId = useStore((state) => state.userId);
    const settings = useStore((state) => state.settings);
    const updateSettings = useStore((state) => state.updateSettings);

    // Placeholder for user email - in a real app we'd store the email in the store or fetch it
    const userEmail = userId ? `User ${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}` : 'Guest';

    const handleSignOut = async () => {
        await signOut();
        router.replace('/login');
    };

    const handleNotificationsToggle = (value: boolean) => {
        updateSettings({ notifications_enabled: value });
    };

    const SettingItem = ({ icon, title, value, type = 'arrow', onPress, switchValue, onSwitchChange }: {
        icon: string,
        title: string,
        value?: string,
        type?: 'arrow' | 'switch' | 'none',
        onPress?: () => void,
        switchValue?: boolean,
        onSwitchChange?: (v: boolean) => void
    }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === 'switch' && !onPress || type === 'none'}>
            <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon as any} size={20} color={Colors.dark.primary} />
                </View>
                <ThemedText style={styles.settingTitle}>{title}</ThemedText>
            </View>
            <View style={styles.settingRight}>
                {value && <ThemedText style={styles.settingValue} color={Colors.dark.textSecondary}>{value}</ThemedText>}
                {type === 'arrow' && <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />}
                {type === 'switch' && (
                    <Switch
                        value={switchValue}
                        onValueChange={onSwitchChange}
                        trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.primary }}
                        thumbColor={Colors.dark.text}
                    />
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="chevron-back" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
                <ThemedText variant="h1" weight="bold">Account</ThemedText>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Section */}
                <View style={styles.section}>
                    <View style={styles.profileCard}>
                        <View style={styles.avatar}>
                            <ThemedText variant="h2" weight="bold" style={{ color: Colors.dark.background }}>
                                {userEmail.charAt(0).toUpperCase()}
                            </ThemedText>
                        </View>
                        <View style={styles.profileInfo}>
                            <ThemedText variant="h3" weight="medium">{userEmail}</ThemedText>
                            <ThemedText variant="caption" color={Colors.dark.textSecondary}>Free Plan</ThemedText>
                        </View>
                        <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert("Coming Soon", "Profile editing will be available in a future update.")}>
                            <ThemedText color={Colors.dark.primary}>Edit</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={styles.sectionHeader}>PREFERENCES</ThemedText>
                    <View style={styles.card}>
                        <SettingItem
                            icon="time-outline"
                            title="Snooze Presets"
                            value={`${settings.snooze_presets_mins.join(', ')}m`}
                            onPress={() => router.push('/snooze-settings')}
                        />
                        <View style={styles.separator} />
                        <SettingItem
                            icon="notifications-outline"
                            title="Notifications"
                            type="switch"
                            switchValue={settings.notifications_enabled}
                            onSwitchChange={handleNotificationsToggle}
                        />
                        <View style={styles.separator} />
                        <SettingItem
                            icon="moon-outline"
                            title="Theme"
                            value="Dark"
                            type="none"
                            onPress={() => Alert.alert("Theme Locked", "Echo is designed in Dark Mode for now.")}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={styles.sectionHeader}>SUPPORT</ThemedText>
                    <View style={styles.card}>
                        <SettingItem
                            icon="information-circle-outline"
                            title="About Echo"
                            onPress={() => Alert.alert("About Echo", "Power Reminders v1.0.0\nBuilt with Expo & Supabase.")}
                        />
                        <View style={styles.separator} />
                        <SettingItem
                            icon="star-outline"
                            title="Rate App"
                            onPress={() => Alert.alert("Rate App", "Thanks for being a beta tester!")}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText variant="label" color={Colors.dark.textSecondary} style={styles.sectionHeader}>APP INFO</ThemedText>
                    <View style={styles.card}>
                        <SettingItem icon="code-slash-outline" title="Version" value="1.0.0" type="none" />
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <ThemedText color={Colors.dark.error} weight="medium">Sign Out</ThemedText>
                    </TouchableOpacity>
                    <ThemedText variant="caption" color={Colors.dark.textMuted} style={styles.versionText}>
                        Echo Inc. © 2026
                    </ThemedText>
                </View>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 12,
    },
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderRadius: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    editButton: {
        padding: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.dark.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 16,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 14,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.dark.surfaceHighlight,
        marginLeft: 60, // Align with text
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
    },
    signOutButton: {
        width: '100%',
        backgroundColor: Colors.dark.surface,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    versionText: {
        marginTop: 16,
    }
});
