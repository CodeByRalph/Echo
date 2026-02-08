import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Layout } from '../../src/components/Layout';
import { StreamCard } from '../../src/components/StreamCard';
import { ThemedText } from '../../src/components/ThemedText';
import { Colors } from '../../src/constants/Colors';
import { useStore } from '../../src/store/useStore';

export default function ExploreScreen() {
    const router = useRouter();
    const publicStreams = useStore((state) => state.publicStreams);
    const fetchPublicStreams = useStore((state) => state.fetchPublicStreams);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPublicStreams();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPublicStreams();
        setRefreshing(false);
    };

    const filteredStreams = publicStreams.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Layout>
            <View style={styles.header}>
                <ThemedText variant="h1" weight="bold">Explore</ThemedText>
                <TouchableOpacity onPress={() => router.push('/stream/create')}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.dark.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search routines..."
                    placeholderTextColor={Colors.dark.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredStreams}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <StreamCard
                        stream={item}
                        onPress={() => router.push(`/stream/${item.id}`)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.text} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="telescope-outline" size={48} color={Colors.dark.textMuted} />
                        <ThemedText color={Colors.dark.textSecondary} style={{ marginTop: 16 }}>
                            No streams found. Be the first to publish one!
                        </ThemedText>
                    </View>
                }
            />
        </Layout>
    );
}


const styles = StyleSheet.create({
    header: {
        marginTop: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.surfaceHighlight,
    },
    searchInput: {
        flex: 1,
        color: Colors.dark.text,
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    }
});
