import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/Colors';

function TabBarButton({ onPress, accessibilityState, children }: any) {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.tabButton, pressed && { transform: [{ scale: 0.96 }] }]}>
            {children}
        </Pressable>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: Colors.dark.border,
                    elevation: 0,
                    backgroundColor: Colors.dark.surface,
                    height: 84,
                    paddingBottom: 16,
                    paddingTop: 12,
                    paddingHorizontal: 16,
                },
                tabBarActiveTintColor: Colors.dark.primary,
                tabBarInactiveTintColor: Colors.dark.textSecondary,
                tabBarBackground: Platform.OS === 'ios' ? () => (
                    <BlurView tint="dark" intensity={30} style={[StyleSheet.absoluteFillObject, styles.tabBarBlur]} />
                ) : undefined,
                tabBarItemStyle: {
                    borderRadius: 12,
                    paddingVertical: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 13,
                    fontWeight: '600',
                    marginTop: 6,
                },
                tabBarButton: (props) => <TabBarButton {...props} />,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Today',
                    tabBarIcon: ({ color, size }) => <Ionicons name="sunny" size={size + 4} color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size + 4} color={color} />,
                }}
            />
            <Tabs.Screen
                name="all"
                options={{
                    title: 'All',
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size + 4} color={color} />,
                }}
            />
        </Tabs >
    );
}

const styles = StyleSheet.create({
    tabBarBlur: {
        backgroundColor: Colors.dark.surface,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    }
});
