import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../src/components/Button';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { supabase } from '../src/lib/supabase';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signInWithEmail = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) Alert.alert('Access Denied', error.message);
        setLoading(false);
    };



    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={[Colors.dark.background, '#1a1a2e', '#0f0f1a']}
                style={styles.background}
            />

            <View style={styles.content}>
                <View style={styles.branding}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="recording-outline" size={48} color={Colors.dark.primary} />
                    </View>
                    <ThemedText variant="h1" weight="bold" style={styles.title}>ECHO</ThemedText>
                    <ThemedText variant="caption" style={styles.subtitle}>SYNCC V.1.0 // PRODUCTIVITY SUITE</ThemedText>
                </View>

                <BlurView intensity={30} tint="dark" style={styles.glassCard}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={Colors.dark.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={Colors.dark.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <Button
                        title={loading ? "Logging in..." : "Login"}
                        onPress={signInWithEmail}
                        disabled={loading}
                        style={styles.signInBtn}
                    />

                    <TouchableOpacity onPress={() => router.push('/signup')} disabled={loading} style={styles.signUpBtn}>
                        <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                            Don&apos;t have an account? <ThemedText color={Colors.dark.primary} weight="bold">Sign Up</ThemedText>
                        </ThemedText>
                    </TouchableOpacity>
                </BlurView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    branding: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.dark.surface + '40', // Low opacity
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.primary + '60',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 32,
        letterSpacing: 8,
        color: Colors.dark.text,
    },
    subtitle: {
        fontSize: 10,
        letterSpacing: 2,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    glassCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: Colors.dark.text,
        fontSize: 14,
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), // Techy font fallback
    },
    signInBtn: {
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: Colors.dark.primary,
        shadowColor: Colors.dark.primaryVibrant,
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    signUpBtn: {
        alignItems: 'center',
        marginTop: 8,
    }
});
