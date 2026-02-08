import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';

export default function EditProfileScreen() {
    const router = useRouter();
    const userProfile = useStore((state) => state.userProfile);
    const updateProfile = useStore((state) => state.updateProfile);

    const [fullName, setFullName] = useState(userProfile?.full_name || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Required", "Please enter your name.");
            return;
        }

        setSaving(true);
        await updateProfile({ full_name: fullName.trim() });
        setSaving(false);
        router.back();
    };

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="close" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
                <ThemedText variant="h1" weight="bold">Edit Profile</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Email (Read Only) */}
                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>EMAIL</ThemedText>
                    <View style={styles.readOnlyInput}>
                        <ThemedText color={Colors.dark.textSecondary}>{userProfile?.email || 'Unknown'}</ThemedText>
                    </View>
                    <ThemedText variant="caption" color={Colors.dark.textMuted} style={{ marginTop: 8 }}>
                        Email cannot be changed directly properly.
                    </ThemedText>
                </View>

                {/* Name Input */}
                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>FULL NAME</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Your Name"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={fullName}
                        onChangeText={setFullName}
                        autoFocus
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <ThemedText weight="bold" color="white" style={{ fontSize: 18 }}>Save Changes</ThemedText>
                    )}
                </TouchableOpacity>

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
    section: {
        marginBottom: 32,
    },
    input: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: Colors.dark.text,
        fontSize: 18,
    },
    readOnlyInput: {
        backgroundColor: Colors.dark.surfaceHighlight,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    saveButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    }

});
