import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';
import { Stream } from '../../src/types';

export default function StreamDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const publicStreams = useStore((state) => state.publicStreams);
    const subscribeToStream = useStore((state) => state.subscribeToStream);

    const [stream, setStream] = useState<Stream | null>(null);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        if (id) {
            const found = publicStreams.find(s => s.id === id);
            if (found) {
                setStream(found);
            }
            // In real app, fetch if not found
        }
    }, [id, publicStreams]);

    const handleSubscribe = async () => {
        if (!stream) return;
        setSubscribing(true);
        await subscribeToStream(stream.id);
        setSubscribing(false);
        Alert.alert("Success", "You are now following this stream. Reminders have been added to your list.");
        router.back();
    };

    if (!stream) {
        return (
            <Layout>
                <View style={styles.loadingContainer}>
                    <ThemedText>Loading stream...</ThemedText>
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
                <ThemedText variant="h1" weight="bold">Stream Details</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="layers" size={32} color={Colors.dark.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText variant="h2" weight="bold">{stream.title}</ThemedText>
                            <ThemedText variant="caption" color={Colors.dark.textSecondary}>by User {stream.creator_id.substring(0, 4)}...</ThemedText>
                        </View>
                    </View>

                    {stream.description && (
                        <ThemedText style={styles.description} color={Colors.dark.textMuted}>
                            {stream.description}
                        </ThemedText>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="heart" size={16} color={Colors.dark.error} />
                            <ThemedText style={{ marginLeft: 4 }}>{stream.likes_count}</ThemedText>
                        </View>
                        <View style={styles.stat}>
                            <Ionicons name="list" size={16} color={Colors.dark.textSecondary} />
                            <ThemedText style={{ marginLeft: 4 }}>{(stream.items || []).length} Items</ThemedText>
                        </View>
                    </View>
                </View>

                <ThemedText variant="h3" weight="bold" style={styles.sectionTitle}>Routine Items</ThemedText>

                {stream.items?.map((item, index) => (
                    <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemIndex}>
                            <ThemedText weight="bold" color={Colors.dark.background}>{index + 1}</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText weight="medium">{item.title}</ThemedText>
                            <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                                {item.day_offset === 0 ? 'Day 1' : `Day ${item.day_offset + 1}`} • {item.time_of_day || 'Any time'}
                            </ThemedText>
                        </View>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Button
                        title={subscribing ? "Following..." : "Follow & Import"}
                        onPress={handleSubscribe}
                        loading={subscribing}
                    />
                    <ThemedText variant="caption" color={Colors.dark.textMuted} style={{ marginTop: 12, textAlign: 'center' }}>
                        This will add {stream.items?.length || 0} recurring reminders to your schedule starting today.
                    </ThemedText>
                </View>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.dark.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceHighlight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sectionTitle: {
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemIndex: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    footer: {
        marginTop: 32,
    }
});
