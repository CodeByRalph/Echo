import React from 'react';
import { Text, TextProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface ThemedTextProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
    color?: string;
    weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export function ThemedText({
    style,
    variant = 'body',
    color = Colors.dark.text,
    weight = 'regular',
    ...rest
}: ThemedTextProps) {

    const getFontSize = () => {
        switch (variant) {
            case 'h1': return 38;
            case 'h2': return 24;
            case 'h3': return 20;
            case 'label': return 13;
            case 'caption': return 12;
            default: return 16;
        }
    };

    const getWeight = () => {
        // Basic mapping, can be enhanced with custom fonts later
        switch (weight) {
            case 'bold': return '700';
            case 'semibold': return '600';
            case 'medium': return '500';
            default: return '400';
        }
    };

    return (
        <Text
            style={[
                {
                    color,
                    fontSize: getFontSize(),
                    fontWeight: getWeight() as any,
                    lineHeight: variant === 'h1' ? 44 : variant === 'h2' ? 30 : variant === 'h3' ? 26 : variant === 'body' ? 24 : undefined
                },
                style
            ]}
            {...rest}
        />
    );
}
