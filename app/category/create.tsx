import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Layout } from '../../src/components/Layout';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';

const COLORS = [
    Colors.dark.primary,
    Colors.dark.accent,
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFE66D', // Yellow
    '#1A535C', // Dark Teal
    '#FF9F1C', // Orange
    '#2EC4B6', // Cyan
    '#E71D36', // Bright Red
    '#7209B7', // Purple
];

const ICONS = ['list', 'briefcase', 'person', 'cart', 'book', 'fitness', 'airplane', 'home', 'star', 'heart', 'school', 'build'];

export default function CreateCategoryScreen() {
    const router = useRouter();
    const addCategory = useStore((state) => state.addCategory);

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

    const handleCreate = () => {
        if (!name.trim()) {
            Alert.alert("Required", "Please enter a category name.");
            return;
        }

        addCategory(name.trim(), selectedColor, selectedIcon);

        // Success feedback handled by store/UI update
        router.back();
    };

    return (
        <Layout>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="close" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
                <ThemedText variant="h1" weight="bold">New Folder</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Name Input */}
                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 8 }}>NAME</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Groceries, Project X"
                        placeholderTextColor={Colors.dark.textMuted}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                {/* Color Picker */}
                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 12 }}>COLOR</ThemedText>
                    <View style={styles.grid}>
                        {COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorOption, { backgroundColor: color }, selectedColor === color && styles.selectedRing]}
                                onPress={() => setSelectedColor(color)}
                            >
                                {selectedColor === color && <Ionicons name="checkmark" size={16} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Icon Picker */}
                <View style={styles.section}>
                    <ThemedText variant="label" style={{ marginBottom: 12 }}>ICON</ThemedText>
                    <View style={styles.grid}>
                        {ICONS.map(icon => (
                            <TouchableOpacity
                                key={icon}
                                style={[styles.iconOption, selectedIcon === icon && { backgroundColor: Colors.dark.surfaceHighlight }]}
                                onPress={() => setSelectedIcon(icon)}
                            >
                                <Ionicons
                                    name={icon as any}
                                    size={24}
                                    color={selectedIcon === icon ? Colors.dark.primary : Colors.dark.textSecondary}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                    <ThemedText weight="bold" color="white" style={{ fontSize: 18 }}>Create Folder</ThemedText>
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
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedRing: {
        borderWidth: 3,
        borderColor: Colors.dark.background,
        // Add a wrapper view for the ring effect if needed, but this is simple enough
        // Or simply scale it up logic
    },
    iconOption: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.surface,
    },
    createButton: {
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
