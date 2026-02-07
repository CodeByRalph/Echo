import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface InputProps extends TextInputProps { }

export function Input({ style, ...props }: InputProps) {
    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor={Colors.dark.textMuted}
                {...props}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    input: {
        padding: 16,
        color: Colors.dark.text,
        fontSize: 16,
    },
});
