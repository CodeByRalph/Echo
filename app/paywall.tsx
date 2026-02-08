import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { PurchaseService } from '../src/services/purchase';
import { useStore } from '../src/store/useStore';

export default function PaywallScreen() {
    const router = useRouter();
    const isPro = useStore((state) => state.isPro);
    const purchasePro = useStore((state) => state.purchasePro);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOfferings = async () => {
            const avail = await PurchaseService.getPackages();
            setPackages(avail);
            setLoading(false);
        };
        loadOfferings();
    }, []);

    const handlePurchase = async (pack: PurchasesPackage) => {
        setLoading(true);
        try {
            const success = await PurchaseService.purchasePackage(pack);
            
            if (success) {
                // Refresh pro status to sync with RevenueCat
                await useStore.getState().checkProStatus();
                Alert.alert("Success", "Welcome to Pro!");
                router.back();
            } else {
                Alert.alert("Payment Failed", "The purchase could not be completed. Please try again.");
            }
        } catch (e: any) {
            // Only show error if user didn't cancel
            if (!e.userCancelled) {
                Alert.alert("Payment Failed", "The purchase could not be completed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        const success = await PurchaseService.restorePurchases();
        setLoading(false);
        if (success) {
            Alert.alert("Restored", "Your purchases have been restored.");
            useStore.getState().checkProStatus(); // Refresh store
            router.back();
        } else {
            Alert.alert("No Purchases", "Could not find any active Pro subscriptions.");
        }
    };

    return (
        <Layout>
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Ionicons name="flash" size={64} color={Colors.dark.primary} />
                    <ThemedText variant="h1" style={styles.title}>Echo Allowed</ThemedText>
                    <ThemedText color={Colors.dark.textSecondary} style={styles.subtitle}>
                        Unlock the full power of your productivity.
                    </ThemedText>
                </View>

                <View style={styles.features}>
                    <FeatureItem icon="folder-open" text="Unlimited Category Folders" />
                    <FeatureItem icon="time" text="Adaptive Snooze" />
                    <FeatureItem icon="alarm" text="Custom Snooze Times" />
                    <FeatureItem icon="people" text="Family Sharing" />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 40 }} />
                ) : (
                    <View style={styles.packages}>
                        {packages.map((pack) => (
                            <TouchableOpacity
                                key={pack.identifier}
                                style={styles.packageButton}
                                onPress={() => handlePurchase(pack)}
                            >
                                <View>
                                    <ThemedText weight="bold" style={{ fontSize: 18 }}>{pack.product.title}</ThemedText>
                                    <ThemedText variant="caption">{pack.product.description}</ThemedText>
                                </View>
                                <ThemedText weight="bold" color={Colors.dark.primary}>{pack.product.priceString}</ThemedText>
                            </TouchableOpacity>
                        ))}

                        {packages.length === 0 && (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ThemedText>No packages found. Is configuration correct?</ThemedText>
                                <TouchableOpacity onPress={() => useStore.getState().togglePro()} style={{ marginTop: 20 }}>
                                    <ThemedText color={Colors.dark.textMuted}>(Dev: Force Upgrade)</ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity onPress={handleRestore} style={{ marginTop: 24 }}>
                    <ThemedText variant="caption" color={Colors.dark.textSecondary}>Restore Purchases</ThemedText>
                </TouchableOpacity>

            </ScrollView>
        </Layout>
    );
}

const FeatureItem = ({ icon, text }: { icon: any, text: string }) => (
    <View style={styles.featureRow}>
        <Ionicons name="checkmark-circle" size={20} color={Colors.dark.accent} />
        <ThemedText style={{ marginLeft: 12, fontSize: 16 }}>{text}</ThemedText>
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingTop: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 0,
        zIndex: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        marginTop: 16,
        fontSize: 32,
        fontWeight: '900',
    },
    subtitle: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 16,
    },
    features: {
        width: '100%',
        gap: 16,
        marginBottom: 40,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surface,
        padding: 16,
        borderRadius: 12,
    },
    packages: {
        width: '100%',
        gap: 12,
    },
    packageButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceHighlight,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    }
});
