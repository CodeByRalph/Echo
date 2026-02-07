import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';

export function ProBadge() {
    return (
        <TouchableOpacity style={styles.container}>
            <LinearGradient
                colors={[Colors.dark.primary, Colors.dark.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <ThemedText variant="caption" weight="bold" style={styles.text}>PRO</ThemedText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
        marginLeft: 8,
    },
    text: {
        color: 'white',
        fontSize: 10,
    }
});
