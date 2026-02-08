import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export function Button({ onPress, title, variant = 'primary', loading, disabled, style }: ButtonProps) {
    const getBackgroundColor = (pressed: boolean) => {
        if (disabled || loading) return Colors.dark.surfaceHighlight;
        if (variant === 'ghost') return 'transparent';
        if (variant === 'secondary') return pressed ? Colors.dark.surfaceHighlight : Colors.dark.surface;
        return pressed ? Colors.dark.primaryVibrant : Colors.dark.primary;
    };

    const getTextColor = () => {
        if (disabled || loading) return Colors.dark.textMuted;
        if (variant === 'ghost') return Colors.dark.primary;
        return Colors.dark.text;
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={loading || disabled}
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: getBackgroundColor(pressed) },
                pressed && { transform: [{ scale: 0.98 }] },
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <ThemedText weight="medium" style={{ color: getTextColor() }}>{title}</ThemedText>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
