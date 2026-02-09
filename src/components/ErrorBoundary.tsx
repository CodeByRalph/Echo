import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import { Button } from './Button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // Report to Sentry if configured
        if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
            Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
                tags: {
                    errorBoundary: true,
                },
            });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <ThemedText variant="h1" weight="bold" style={styles.title}>
                        Something went wrong
                    </ThemedText>
                    <ThemedText color={Colors.dark.textSecondary} style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </ThemedText>
                    <Button
                        title="Try Again"
                        onPress={this.handleReset}
                        style={styles.button}
                    />
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.dark.background,
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        marginBottom: 24,
        textAlign: 'center',
    },
    button: {
        minWidth: 120,
    },
});
