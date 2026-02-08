import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface LayoutProps {
    children: React.ReactNode;
    noPadding?: boolean;
}

export function Layout({ children, noPadding = false }: LayoutProps) {
    const fade = useRef(new Animated.Value(0)).current;
    const rise = useRef(new Animated.Value(6)).current;
    const glowShift = useRef(new Animated.Value(0)).current;
    const glowBreath = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
            Animated.timing(rise, { toValue: 0, duration: 260, useNativeDriver: true })
        ]).start();
    }, [fade, rise]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(glowShift, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(glowShift, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(glowBreath, { toValue: 0.85, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(glowBreath, { toValue: 0.6, duration: 5200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [glowBreath, glowShift]);

    return (
        <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
            <LinearGradient
                colors={['rgba(147,197,253,0.08)', 'rgba(11,12,16,0.0)', 'rgba(11,12,16,0.0)']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <Animated.View
                style={[
                    styles.glow,
                    styles.glowTop,
                    {
                        opacity: glowBreath,
                        transform: [
                            { translateX: glowShift.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
                            { translateY: glowShift.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }
                        ]
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.glow,
                    styles.glowBottom,
                    {
                        opacity: glowBreath,
                        transform: [
                            { translateX: glowShift.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
                            { translateY: glowShift.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) }
                        ]
                    }
                ]}
            />
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar style="light" />
                <Animated.View
                    style={[
                        styles.content,
                        noPadding && { paddingHorizontal: 0 },
                        { opacity: fade, transform: [{ translateY: rise }] }
                    ]}
                >
                    {children}
                </Animated.View>
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
