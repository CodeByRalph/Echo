import { eachDayOfInterval, format, subDays } from 'date-fns';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useStore } from '../store/useStore';
import { ThemedText } from './ThemedText';

export function ProductivityHeatmap() {
    const activity = useStore((state) => state.activity);

    // Generate last 105 days (15 weeks)
    const today = new Date();
    const startDate = subDays(today, 104); // 15 weeks * 7 days - 1
    const dates = eachDayOfInterval({ start: startDate, end: today });

    // Determine color based on count
    const getColor = (count: number) => {
        if (count === 0) return 'rgba(255,255,255,0.06)';
        if (count <= 2) return 'rgba(147,197,253,0.28)';
        if (count <= 4) return 'rgba(147,197,253,0.46)';
        return 'rgba(147,197,253,0.72)';
    };

    const HeatCell = ({ count }: { count: number }) => {
        const scale = useRef(new Animated.Value(1)).current;
        const opacity = useRef(new Animated.Value(count === 0 ? 0.4 : 1)).current;
        const backgroundColor = useMemo(() => getColor(count), [count]);

        useEffect(() => {
            Animated.timing(opacity, {
                toValue: count === 0 ? 0.4 : 1,
                duration: 240,
                useNativeDriver: true,
            }).start();

            if (count > 0) {
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1.06, duration: 140, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
                ]).start();
            }
        }, [count, opacity, scale]);

        return (
            <Animated.View
                style={[
                    styles.cell,
                    { backgroundColor, opacity, transform: [{ scale }] }
                ]}
            />
        );
    };

    return (
        <View style={styles.container}>
            <ThemedText variant="h2" weight="semibold" style={styles.header}>Productivity</ThemedText>
            <View style={styles.grid}>
                {dates.map((date) => {
                    const key = format(date, 'yyyy-MM-dd');
                    const count = activity[key] || 0;
                    return (
                        <HeatCell key={key} count={count} />
                    );
                })}
            </View>
            <View style={styles.legend}>
                <ThemedText variant="caption" color={Colors.dark.textSecondary}>Less</ThemedText>
                <View style={[styles.legendCell, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
                <View style={[styles.legendCell, { backgroundColor: 'rgba(147,197,253,0.28)' }]} />
                <View style={[styles.legendCell, { backgroundColor: 'rgba(147,197,253,0.46)' }]} />
                <View style={[styles.legendCell, { backgroundColor: 'rgba(147,197,253,0.72)' }]} />
                <ThemedText variant="caption" color={Colors.dark.textSecondary}>More</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        height: 126,
        // Actually, for a heatmap, we usually want Columns = Weeks, Rows = Days.
        // Flex wrap defaults to wrapping rows. 
        // Trick: Rotate container -90deg? Or just map by columns.
        // Simplifying for MVP: Just a grid of squares left-to-right.
    },
    cell: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 4
    },
    legendCell: {
        width: 10,
        height: 10,
        borderRadius: 2
    }
});
