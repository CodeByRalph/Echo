import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

export interface BottomSheetAction {
    label: string;
    onPress: () => void;
    tone?: 'default' | 'accent' | 'destructive';
}

interface BlurredBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    actions?: BottomSheetAction[];
    children?: React.ReactNode;
}

export function BlurredBottomSheet({
    visible,
    onClose,
    title,
    subtitle,
    actions = [],
    children
}: BlurredBottomSheetProps) {
    const [mounted, setMounted] = useState(visible);
    const translateY = useRef(new Animated.Value(40)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setMounted(true);
            Animated.parallel([
                Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true })
            ]).start();
        } else if (mounted) {
            Animated.parallel([
                Animated.timing(translateY, { toValue: 40, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true })
            ]).start(() => setMounted(false));
        }
    }, [visible, mounted, opacity, translateY]);

    const hasHeader = useMemo(() => Boolean(title || subtitle), [title, subtitle]);

    if (!mounted) return null;

    return (
        <Modal transparent visible={mounted} onRequestClose={onClose} statusBarTranslucent>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Animated.View style={[styles.overlayTint, { opacity }]} />
            </Pressable>
            <Animated.View style={[styles.sheetWrap, { transform: [{ translateY }], opacity }]}>
                <BlurView intensity={30} tint="dark" style={styles.sheet}>
                    <View style={styles.sheetInner}>
                        {hasHeader && (
                            <View style={styles.header}>
                                {title && <ThemedText variant="h3" weight="semibold">{title}</ThemedText>}
                                {subtitle && (
                                    <ThemedText variant="caption" color={Colors.dark.textSecondary} style={{ marginTop: 6 }}>
                                        {subtitle}
                                    </ThemedText>
                                )}
                            </View>
                        )}
                        {children}
                        {actions.length > 0 && (
                            <View style={styles.actions}>
                                {actions.map((action) => (
                                    <Pressable
                                        key={action.label}
                                        onPress={action.onPress}
                                        style={({ pressed }) => [
                                            styles.actionButton,
                                            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                                        ]}
                                    >
                                        <ThemedText
                                            weight="semibold"
                                            style={{
                                                color:
                                                    action.tone === 'accent' ? Colors.dark.primary :
                                                    action.tone === 'destructive' ? Colors.dark.error :
                                                    Colors.dark.text
                                            }}
                                        >
                                            {action.label}
                                        </ThemedText>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </View>
                </BlurView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayTint: {
        flex: 1,
        backgroundColor: 'rgba(10, 12, 16, 0.35)'
    },
    sheetWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    sheet: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: Colors.dark.glass,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: Colors.dark.shadow,
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 14,
    },
    sheetInner: {
        padding: 20,
        gap: 16,
    },
    header: {
        paddingBottom: 4,
    },
    actions: {
        gap: 10,
    },
    actionButton: {
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
