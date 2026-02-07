import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useStore } from '../store/useStore';
import { ThemedText } from './ThemedText';

export function DashboardStats() {
    const reminders = useStore((state) => state.reminders);
    const router = useRouter();
    const completed = reminders.filter(r => r.status === 'done' && !r.deleted_at).length;
    const pending = reminders.filter(r => r.status === 'active' && !r.deleted_at).length;

    // Simple urgency check: active + past due
    const overdue = reminders.filter(r =>
        r.status === 'active' &&
        !r.deleted_at &&
        new Date(r.next_fire_at).getTime() < Date.now()
    ).length;

    const StatCard = ({ label, value, color, onPress }: { label: string, value: number, color: string, onPress?: () => void }) => (
        <Pressable
            style={({ pressed }) => [styles.card, { borderColor: color + '40', opacity: pressed ? 0.8 : 1 }]}
            onPress={onPress}
            disabled={!onPress}
        >
            {/* Glossy overlay simulation */}
            <LinearGradient
                colors={[color + '20', Colors.dark.glass]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <ThemedText variant="h2" weight="bold" style={{ color: color }}>
                {value}
            </ThemedText>
            <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                {label}
            </ThemedText>
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatCard label="Pending" value={pending} color={Colors.dark.primary} />
            <StatCard label="Overdue" value={overdue} color={Colors.dark.accent} />
            <StatCard
                label="Done"
                value={completed}
                color={Colors.dark.success}
                onPress={() => router.push('/all')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    card: {
        flex: 1,
        height: 100,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: Colors.dark.surface,
    }
});
