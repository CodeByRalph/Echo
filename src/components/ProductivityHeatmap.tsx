import { eachDayOfInterval, format, subDays } from 'date-fns';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
        if (count === 0) return Colors.dark.surfaceHighlight;
        if (count <= 2) return Colors.dark.primary + '60'; // 40% opacity
        if (count <= 4) return Colors.dark.primary + '90'; // 60% opacity
        return Colors.dark.primary; // Full opacity
    };

    return (
        <View style={styles.container}>
            <ThemedText variant="h3" weight="bold" style={styles.header}>Productivity</ThemedText>
            <View style={styles.grid}>
                {dates.map((date) => {
                    const key = format(date, 'yyyy-MM-dd');
                    const count = activity[key] || 0;
                    return (
                        <View
                            key={key}
                            style={[
                                styles.cell,
                                { backgroundColor: getColor(count) }
                            ]}
                        />
                    );
                })}
            </View>
            <View style={styles.legend}>
                <ThemedText variant="caption" color={Colors.dark.textSecondary}>Less</ThemedText>
                <View style={[styles.legendCell, { backgroundColor: Colors.dark.surfaceHighlight }]} />
                <View style={[styles.legendCell, { backgroundColor: Colors.dark.primary + '60' }]} />
                <View style={[styles.legendCell, { backgroundColor: Colors.dark.primary + '90' }]} />
                <View style={[styles.legendCell, { backgroundColor: Colors.dark.primary }]} />
                <ThemedText variant="caption" color={Colors.dark.textSecondary}>More</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        height: 120, // Constrain height to force wrapping into rows (or use column wrap trick)
        // Actually, for a heatmap, we usually want Columns = Weeks, Rows = Days.
        // Flex wrap defaults to wrapping rows. 
        // Trick: Rotate container -90deg? Or just map by columns.
        // Simplifying for MVP: Just a grid of squares left-to-right.
    },
    cell: {
        width: 12,
        height: 12,
        borderRadius: 2,
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
