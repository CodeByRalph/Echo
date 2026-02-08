import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../src/constants/Colors';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 0,
                    backgroundColor: Colors.dark.surface,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.dark.primary,
                tabBarInactiveTintColor: Colors.dark.textSecondary,
                tabBarBackground: Platform.OS === 'ios' ? () => (
                    <BlurView tint="dark" intensity={80} style={{ flex: 1 }} />
                ) : undefined,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Today',
                    tabBarIcon: ({ color, size }) => <Ionicons name="sunny" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="all"
                options={{
                    title: 'All',
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
                }}
            />
        </Tabs >
    );
}
