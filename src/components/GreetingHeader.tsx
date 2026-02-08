import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { ProBadge } from './ProBadge';
import { ThemedText } from './ThemedText';
import { useStore } from '../store/useStore';

export function GreetingHeader() {
    // Apple Reminders often just uses "Today" or the List Name as the large title
    // For this MVP, we'll keep the Greeting but make it look like a Large Title
    const hours = new Date().getHours();
    let greeting = 'Good Evening';
    if (hours < 12) greeting = 'Good Morning';
    else if (hours < 18) greeting = 'Good Afternoon';

    const router = useRouter();
    const isPro = useStore(state => state.isPro);

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText variant="h1" weight="bold" style={styles.title}>
                        {greeting}
                    </ThemedText>
                    {isPro && <ProBadge />}
                </View>
                <TouchableOpacity onPress={() => router.push('/account')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="person-circle-outline" size={32} color={Colors.dark.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 34,
        letterSpacing: 0.37, // Apple Large Title tracking
        lineHeight: 41,
    }
});
