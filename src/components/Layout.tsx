import { LinearGradient } from 'expo-linear-gradient';
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
            <LinearGradient
                colors={['rgba(147,197,253,0.08)', 'rgba(11,12,16,0.0)', 'rgba(11,12,16,0.0)']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.glow, styles.glowTop]} />
            <View style={[styles.glow, styles.glowBottom]} />
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
    glow: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: Colors.dark.bloom,
        opacity: 0.6,
    },
    glowTop: {
        top: -160,
        right: -80,
    },
    glowBottom: {
        bottom: -180,
        left: -120,
    }
});
