import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurredBottomSheet } from './BlurredBottomSheet';
import { Colors } from '../constants/Colors';
import { useStore } from '../store/useStore';
import { Category } from '../types';
import { ThemedText } from './ThemedText';

export function CategoryGrid() {
    const categories = useStore((state) => state.categories);
    const reminders = useStore((state) => state.reminders);
    const isPro = useStore((state) => state.isPro);
    const households = useStore((state) => state.households);
    const activeHouseholdId = useStore((state) => state.activeHouseholdId);
    const currentHousehold = useMemo(() => households.find(h => h.id === activeHouseholdId), [households, activeHouseholdId]);
    const router = useRouter();
    const [showProSheet, setShowProSheet] = useState(false);

    // Memoize counts calculation
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        const activeReminders = reminders.filter(r => r.status === 'active' && !r.deleted_at);
        
        // Count by category_id
        activeReminders.forEach(r => {
            if (r.category_id) {
            counts[r.category_id] = (counts[r.category_id] || 0) + 1;
            }
        });
        
        // Count family household if exists
        if (currentHousehold) {
            counts['family-household'] = activeReminders.filter(r => r.household_id === currentHousehold.id).length;
        }
        
        return counts;
    }, [reminders, currentHousehold]);

    // Calculate counts
    const getCount = (catId: string) => {
        return categoryCounts[catId] || 0;
    };

    const handleNewCategory = () => {
        if (!isPro) {
            setShowProSheet(true);
        } else {
            router.push('/category/create');
        }
    };

    const CategoryCard = React.memo(({ category, count, onPress }: { category: Category; count: number; onPress: () => void }) => (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: category.color + '22' }]}>
                <Ionicons name={category.icon as any || 'list'} size={16} color={category.color} />
            </View>
            <View style={styles.content}>
                <ThemedText weight="semibold" style={styles.name}>{category.name}</ThemedText>
                <ThemedText variant="h2" weight="semibold" style={styles.count}>{count}</ThemedText>
                <ThemedText variant="caption" color={Colors.dark.textSecondary}>active</ThemedText>
            </View>
        </Pressable>
    ));

    return (
        <View style={styles.container}>
            {/* Family Section (Separate) */}
            {currentHousehold && (
                <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
                    <ThemedText variant="h2" weight="semibold" style={{ marginBottom: 12 }}>Family Space</ThemedText>
                    <TouchableOpacity
                        style={[styles.card, styles.familyCard]}
                        onPress={() => router.push('/category/family-household')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.dark.accent + '22', width: 44, height: 44, borderRadius: 22 }]}>
                                <Ionicons name="people" size={20} color={Colors.dark.accent} />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <ThemedText weight="semibold" style={styles.name}>{currentHousehold.name}</ThemedText>
                                <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                                    {categoryCounts['family-household'] || 0} active tasks
                                </ThemedText>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Other Categories */}
            <ThemedText variant="h2" weight="semibold" style={{ marginBottom: 12, paddingHorizontal: 20 }}>Lists</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {categories.map(cat => (
                    <CategoryCard 
                        key={cat.id} 
                        category={cat} 
                        count={getCount(cat.id)} 
                        onPress={() => router.push(`/category/${cat.id}`)}
                    />
                ))}

                {/* New List Button */}
                <Pressable style={({ pressed }) => [styles.card, styles.newCard, pressed && { transform: [{ scale: 0.98 }] }]} onPress={handleNewCategory}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.dark.surfaceHighlight }]}>
                        <Ionicons name="add" size={20} color={Colors.dark.text} />
                    </View>
                    <ThemedText weight="medium" style={styles.name}>New</ThemedText>
                </Pressable>
            </ScrollView>

            <BlurredBottomSheet
                visible={showProSheet}
                onClose={() => setShowProSheet(false)}
                title="Upgrade to Echo Pro"
                subtitle="Unlock unlimited lists, icons, and family spaces."
                actions={[
                    { label: 'Maybe later', onPress: () => setShowProSheet(false) },
                    { label: 'Upgrade now', tone: 'accent', onPress: () => { setShowProSheet(false); router.push('/paywall'); } }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 14,
    },
    card: {
        width: 104,
        height: 132,
        backgroundColor: Colors.dark.surfaceElevated,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: Colors.dark.shadow,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    familyCard: {
        width: '100%',
        height: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    newCard: {
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
        backgroundColor: Colors.dark.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'solid',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {

    },
    name: {
        fontSize: 14,
    },
    count: {
        marginTop: 6,
        color: Colors.dark.text,
    }
});
