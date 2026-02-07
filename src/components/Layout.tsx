import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface LayoutProps {
    children: React.ReactNode;
    noPadding?: boolean;
}

export function Layout({ children, noPadding = false }: LayoutProps) {
    return (
        <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar style="light" />
                <View style={[styles.content, noPadding && { paddingHorizontal: 0 }]}>
                    {children}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
});
