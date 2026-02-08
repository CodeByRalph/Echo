import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

interface AvatarProps {
    name: string; // Used for initials
    size?: number;
    color?: string;
}

export function Avatar({ name, size = 32, color = Colors.dark.primary }: AvatarProps) {
    const initials = name ? name.substring(0, 2).toUpperCase() : '??';

    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
            <ThemedText style={[styles.text, { fontSize: size * 0.4 }]} weight="bold">
                {initials}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    text: {
        color: 'white',
    }
});
