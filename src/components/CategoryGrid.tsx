import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useStore } from '../store/useStore';
import { Category } from '../types';
import { ThemedText } from './ThemedText';

export function CategoryGrid() {
    const categories = useStore((state) => state.categories);
    const reminders = useStore((state) => state.reminders);
    const isPro = useStore((state) => state.isPro);
    const togglePro = useStore((state) => state.togglePro); // Temp for demo
    const currentHousehold = useStore((state) => state.currentHousehold);
    const router = useRouter();

    // Calculate counts
    const getCount = (catId: string) => {
        if (catId === 'family-household') {
            return reminders.filter(r => currentHousehold && r.household_id === currentHousehold.id && r.status === 'active' && !r.deleted_at).length;
        }
        return reminders.filter(r => r.category_id === catId && r.status === 'active' && !r.deleted_at).length;
    };

    const handleNewCategory = () => {
        if (!isPro) {
            Alert.alert(
                "Upgrade to Pro",
                "Create unlimited custom lists, unlock icons, and more!",
                [
                    { text: "Maybe Later", style: "cancel" },
                    { text: "Upgrade Now", onPress: () => togglePro() } // Simulate upgrade
                ]
            );
        } else {
            // TODO: Navigate to create category screen or show modal input
            Alert.alert("Pro Feature", "Category Creation UI coming soon!");
        }
    };

    const CategoryCard = ({ category }: { category: Category }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push(`/category/${category.id}`)}>
            <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any || 'list'} size={18} color="white" />
            </View>
            <View style={styles.content}>
                <ThemedText weight="bold" style={styles.name}>{category.name}</ThemedText>
                <ThemedText variant="caption" color={Colors.dark.textSecondary}>{getCount(category.id)}</ThemedText>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Family Section (Separate) */}
            {currentHousehold && (
                <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
                    <ThemedText variant="h3" weight="bold" style={{ marginBottom: 12 }}>Family Space</ThemedText>
                    <TouchableOpacity
                        style={[styles.card, styles.familyCard]}
                        onPress={() => router.push('/category/family-household')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.iconContainer, { backgroundColor: Colors.dark.accent, width: 40, height: 40, borderRadius: 20 }]}>
                                <Ionicons name="people" size={24} color="white" />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <ThemedText weight="bold" style={styles.name}>{currentHousehold.name}</ThemedText>
                                <ThemedText variant="caption" color={Colors.dark.textSecondary}>
                                    {getCount('family-household')} active tasks
                                </ThemedText>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Other Categories */}
            <ThemedText variant="h3" weight="bold" style={{ marginBottom: 12, paddingHorizontal: 20 }}>Lists</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {categories.map(cat => (
                    <CategoryCard key={cat.id} category={cat} />
                ))}

                {/* New List Button */}
                <TouchableOpacity style={[styles.card, styles.newCard]} onPress={handleNewCategory}>
                    <View style={[styles.iconContainer, { backgroundColor: Colors.dark.surfaceHighlight }]}>
                        <Ionicons name="add" size={20} color={Colors.dark.text} />
                    </View>
                    <ThemedText weight="medium" style={styles.name}>New</ThemedText>
                </TouchableOpacity>
            </ScrollView>

            {!isPro && (
                <TouchableOpacity onPress={togglePro} style={{ paddingHorizontal: 20, marginTop: 16 }}>
                    <ThemedText variant="caption" color={Colors.dark.textMuted} style={{ fontSize: 10 }}>(Dev: Toggle Pro)</ThemedText>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    card: {
        width: 100,
        height: 100,
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 12,
        justifyContent: 'space-between',
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
        borderColor: Colors.dark.border,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
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
    }
});
