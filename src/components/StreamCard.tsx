import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Stream } from '../types';
import { ThemedText } from './ThemedText';

interface Props {
    stream: Stream;
    onPress: () => void;
}

export const StreamCard = React.memo(function StreamCard({ stream, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="layers-outline" size={24} color={Colors.dark.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <ThemedText variant="h3" weight="bold" numberOfLines={1}>{stream.title}</ThemedText>
                    <ThemedText variant="caption" color={Colors.dark.textSecondary}>by User {stream.creator_id.substring(0, 4)}...</ThemedText>
                </View>
                {/* Likes / Popularity placeholder */}
                <View style={styles.badge}>
                    <Ionicons name="heart" size={12} color={Colors.dark.textSecondary} />
                    <ThemedText variant="caption" weight="medium" style={{ marginLeft: 4 }}>{stream.likes_count}</ThemedText>
                </View>
            </View>

            {stream.description && (
                <ThemedText style={styles.description} numberOfLines={2} color={Colors.dark.textMuted}>
                    {stream.description}
                </ThemedText>
            )}

            <View style={styles.footer}>
                <ThemedText variant="caption" color={Colors.dark.primary} weight="bold">
                    {(stream.items || []).length} items
                </ThemedText>
                {stream.category && (
                    <View style={styles.tag}>
                        <ThemedText variant="caption" style={{ fontSize: 10 }}>{stream.category}</ThemedText>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.dark.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceHighlight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    description: {
        fontSize: 14,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    }
});
