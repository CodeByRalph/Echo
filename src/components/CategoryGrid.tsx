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
    const router = useRouter();

    // Calculate counts
    const getCount = (catId: string) =>
        reminders.filter(r => r.category_id === catId && r.status === 'active' && !r.deleted_at).length;

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
                <TouchableOpacity onPress={togglePro} style={{ paddingHorizontal: 20, marginTop: 8 }}>
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
