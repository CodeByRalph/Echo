import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { BlurredBottomSheet } from '../src/components/BlurredBottomSheet';
import { Layout } from '../src/components/Layout';
import { ThemedText } from '../src/components/ThemedText';
import { Colors } from '../src/constants/Colors';
import { PurchaseService } from '../src/services/purchase';
import { useStore } from '../src/store/useStore';

export default function PaywallScreen() {
    const router = useRouter();
    const isPro = useStore((state) => state.isPro);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState<string | null>(null);
    const [showRestoreResult, setShowRestoreResult] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Check Pro status on mount and redirect Pro users away from paywall
    useEffect(() => {
        // Check Pro status from RevenueCat on mount
        useStore.getState().checkProStatus().then(() => {
            const currentIsPro = useStore.getState().isPro;
            if (currentIsPro && !isRedirecting) {
                console.log('User is already Pro, redirecting away from paywall');
                setIsRedirecting(true);
                router.back();
            }
        });
    }, []);

    // Also redirect if isPro changes to true
    useEffect(() => {
        if (isPro && !isRedirecting) {
            console.log('User became Pro, redirecting away from paywall');
            setIsRedirecting(true);
            // Use setTimeout to avoid React hooks issues during navigation
            setTimeout(() => {
                router.back();
            }, 100);
        }
    }, [isPro, router, isRedirecting]);

    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const sortedPackages = useMemo(() => {
        // Sort packages: annual first (best value), then monthly
        return [...packages].sort((a, b) => {
            const aId = a.identifier.toLowerCase();
            const bId = b.identifier.toLowerCase();
            const aIsAnnual = aId.includes('annual') || aId.includes('year');
            const bIsAnnual = bId.includes('annual') || bId.includes('year');
            if (aIsAnnual && !bIsAnnual) return -1;
            if (!aIsAnnual && bIsAnnual) return 1;
            return 0;
        });
    }, [packages]);

    useEffect(() => {
        const loadOfferings = async () => {
            try {
                const avail = await PurchaseService.getPackages();
                // Filter out lifetime packages
                const filtered = avail.filter(pack => {
                    const identifier = pack.identifier.toLowerCase();
                    const productId = pack.product.identifier.toLowerCase();
                    return !identifier.includes('lifetime') && 
                           !identifier.includes('$lifetime') &&
                           !productId.includes('lifetime');
                });
                setPackages(filtered);
                
                // Set default selected package (annual if available, otherwise first)
                if (filtered.length > 0) {
                    const annual = filtered.find(p => 
                        p.identifier.toLowerCase().includes('annual') || 
                        p.identifier.toLowerCase().includes('year')
                    );
                    setSelectedPackage(annual || filtered[0]);
                }
            } catch (e) {
                console.error('Error loading packages:', e);
                setShowError('Failed to load subscription options. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        loadOfferings();
    }, []);

    // Don't render paywall content for Pro users (all hooks must be above this point)
    if (isPro || isRedirecting) {
        return (
            <Layout>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 100 }} />
                </View>
            </Layout>
        );
    }

    const calculateSavings = (pack: PurchasesPackage, allPacks: PurchasesPackage[]) => {
        const monthlyPack = allPacks.find(p => 
            p.identifier.toLowerCase().includes('month') || 
            p.identifier.toLowerCase().includes('$monthly')
        );
        if (!monthlyPack || !pack.product.price || !monthlyPack.product.price) return null;
        
        const packPrice = pack.product.price;
        const monthlyPrice = monthlyPack.product.price;
        const isAnnual = pack.identifier.toLowerCase().includes('annual') || 
                        pack.identifier.toLowerCase().includes('year');
        
        if (isAnnual && monthlyPrice > 0) {
            const annualEquivalent = monthlyPrice * 12;
            const savings = annualEquivalent - packPrice;
            const savingsPercent = Math.round((savings / annualEquivalent) * 100);
            if (savingsPercent > 0) {
                return savingsPercent;
            }
        }
        return null;
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        
        // Check if user is already Pro - prevent duplicate purchases
        const currentIsPro = useStore.getState().isPro;
        if (currentIsPro) {
            setShowError('You are already a Pro member!');
            return;
        }
        
        setPurchasing(true);
        try {
            const success = await PurchaseService.purchasePackage(selectedPackage);
            
            // Only proceed if purchase actually succeeded
            if (!success) {
                setShowError('The purchase could not be completed. Please try again.');
                setPurchasing(false);
                return;
            }
            
            // Purchase succeeded - immediately mark user as Pro to prevent duplicate purchases
            console.log('Purchase succeeded, marking user as Pro immediately');
            useStore.getState().setProStatus(true);
            
            // Verify pro status with RevenueCat (double-check, but don't overwrite if already Pro)
            // RevenueCat sometimes needs a moment to sync entitlements, especially in test mode
            // We've already set Pro status above, so we'll verify but keep Pro status even if RevenueCat hasn't synced yet
            const maxRetries = 3;
            const retryDelay = 1000; // Increased delay to give RevenueCat more time
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                // Wait before checking (except on first attempt)
                if (attempt > 0) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
                
                await useStore.getState().checkProStatus();
                const verifiedPro = useStore.getState().isPro;
                
                if (verifiedPro) {
                    console.log(`Pro status confirmed with RevenueCat after ${attempt + 1} attempt(s)`);
                    break;
                }
                
                // Keep Pro status set even if RevenueCat hasn't synced yet
                // The purchase succeeded, so we trust that
                useStore.getState().setProStatus(true);
                
                if (attempt < maxRetries - 1) {
                    console.log(`RevenueCat not synced yet, but purchase succeeded - keeping Pro status (attempt ${attempt + 1}/${maxRetries})`);
                }
            }
            
            // Ensure Pro status is set (purchase succeeded, so user is Pro)
            useStore.getState().setProStatus(true);
            console.log('Purchase completed successfully - user is now Pro');
            
            setShowSuccess(true);
        } catch (e: any) {
            // Only show error if user didn't cancel
            if (!e.userCancelled) {
                console.error('Purchase error in handlePurchase:', e);
                if (e.code === '5' || e.message?.includes('test purchase failure')) {
                    setShowError('Test purchase failed. Please use a valid test purchase in RevenueCat.');
                } else {
                    setShowError('The purchase could not be completed. Please try again.');
                }
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            const success = await PurchaseService.restorePurchases();
            await useStore.getState().checkProStatus();
            if (success) {
                setShowRestoreResult('success');
            } else {
                setShowRestoreResult('none');
            }
        } catch (e) {
            setShowRestoreResult('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <View style={styles.container}>
                <Pressable onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
                </Pressable>

                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <View style={styles.iconWrapper}>
                            <Ionicons name="flash" size={48} color={Colors.dark.primary} />
                        </View>
                        <ThemedText variant="h1" weight="bold" style={styles.title}>Echo Pro</ThemedText>
                        <ThemedText color={Colors.dark.textSecondary} style={styles.subtitle}>
                            Unlock unlimited productivity features
                        </ThemedText>
                    </View>

                    {/* Features Section */}
                    <View style={styles.featuresSection}>
                        <ThemedText variant="h3" weight="semibold" style={styles.sectionTitle}>
                            What's included
                        </ThemedText>
                        <View style={styles.features}>
                            <FeatureItem icon="folder-open" text="Unlimited lists and categories" />
                            <FeatureItem icon="time" text="Smart adaptive snooze" />
                            <FeatureItem icon="people" text="Multiple family spaces" />
                            <FeatureItem icon="sparkles" text="Priority support" />
                        </View>
                    </View>

                    {/* Packages Section */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.dark.primary} />
                            <ThemedText color={Colors.dark.textSecondary} style={{ marginTop: 16 }}>
                                Loading subscription options...
                            </ThemedText>
                        </View>
                    ) : packages.length > 0 ? (
                        <View style={styles.packagesSection}>
                            <ThemedText variant="h3" weight="semibold" style={styles.sectionTitle}>
                                Choose your plan
                            </ThemedText>
                            <View style={styles.packages}>
                                {sortedPackages.map((pack, index) => {
                                    const isSelected = selectedPackage?.identifier === pack.identifier;
                                    const isAnnual = pack.identifier.toLowerCase().includes('annual') || 
                                                   pack.identifier.toLowerCase().includes('year');
                                    const isPopular = isAnnual && index === 0;
                                    const savings = calculateSavings(pack, sortedPackages);
                                    
                                    return (
                                        <Pressable
                                            key={pack.identifier}
                                            style={({ pressed }) => [
                                                styles.packageButton,
                                                isPopular && styles.popularButton,
                                                isSelected && styles.selectedButton,
                                                pressed && { transform: [{ scale: 0.98 }] }
                                            ]}
                                            onPress={() => setSelectedPackage(pack)}
                                            disabled={purchasing}
                                        >
                                            {isPopular && (
                                                <View style={styles.popularBadge}>
                                                    <View style={styles.badgeGradient}>
                                                        <ThemedText variant="caption" weight="bold" style={styles.badgeText}>
                                                            BEST VALUE
                                                        </ThemedText>
                                                    </View>
                                                </View>
                                            )}
                                            <View style={styles.packageInfo}>
                                                <View style={styles.packageHeader}>
                                                    <ThemedText 
                                                        weight="bold" 
                                                        style={[styles.packageTitle, isPopular && styles.popularTitle]}
                                                    >
                                                        {pack.product.title}
                                                    </ThemedText>
                                                    {savings && (
                                                        <View style={styles.savingsBadge}>
                                                            <ThemedText variant="caption" weight="bold" style={styles.savingsText}>
                                                                Save {savings}%
                                                            </ThemedText>
                                                        </View>
                                                    )}
                                                </View>
                                                {pack.product.description && (
                                                    <ThemedText 
                                                        variant="caption" 
                                                        style={[styles.packageDesc, isPopular && styles.popularDesc]}
                                                    >
                                                        {pack.product.description}
                                                    </ThemedText>
                                                )}
                                            </View>
                                            <View style={styles.priceContainer}>
                                                {isSelected && (
                                                    <View style={styles.checkIcon}>
                                                        <Ionicons name="checkmark-circle" size={26} color={Colors.dark.primary} />
                                                    </View>
                                                )}
                                                <View style={styles.priceInfo}>
                                                    <ThemedText 
                                                        weight="bold" 
                                                        style={[styles.packagePrice, isPopular && styles.popularPrice]}
                                                    >
                                                        {pack.product.priceString}
                                                    </ThemedText>
                                                    {isAnnual ? (
                                                        <ThemedText 
                                                            variant="caption" 
                                                            style={[styles.pricePeriod, isPopular && styles.popularPeriod]}
                                                        >
                                                            per year
                                                        </ThemedText>
                                                    ) : (
                                                        <ThemedText 
                                                            variant="caption" 
                                                            style={[styles.pricePeriod, isPopular && styles.popularPeriod]}
                                                        >
                                                            per month
                                                        </ThemedText>
                                                    )}
                                                </View>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="alert-circle-outline" size={48} color={Colors.dark.textMuted} />
                            <ThemedText color={Colors.dark.textSecondary} style={{ marginTop: 16, textAlign: 'center' }}>
                                No subscription packages available.
                            </ThemedText>
                            <ThemedText variant="caption" color={Colors.dark.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>
                                Please check your RevenueCat configuration.
                            </ThemedText>
                            <Pressable onPress={() => useStore.getState().togglePro()} style={{ marginTop: 20 }}>
                                <ThemedText variant="caption" color={Colors.dark.textMuted}>
                                    (Dev: Force Upgrade)
                                </ThemedText>
                            </Pressable>
                        </View>
                    )}

                    {/* CTA Section */}
                    {!loading && packages.length > 0 && selectedPackage && (
                        <View style={styles.ctaSection}>
                            <Pressable
                                onPress={handlePurchase}
                                disabled={purchasing || !selectedPackage}
                                style={({ pressed }) => [
                                    styles.ctaButton,
                                    pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }
                                ]}
                            >
                                {purchasing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <ThemedText weight="bold" style={styles.ctaButtonText}>
                                        Get Pro Now • {selectedPackage.product.priceString}
                                    </ThemedText>
                                )}
                            </Pressable>
                            <ThemedText variant="caption" color={Colors.dark.textMuted} style={styles.ctaSubtext}>
                                Tap to start your subscription
                            </ThemedText>
                        </View>
                    )}

                    {/* Footer Section */}
                    <View style={styles.footerSection}>
                        <Pressable 
                            onPress={handleRestore} 
                            style={({ pressed }) => [styles.restoreButton, pressed && { opacity: 0.7 }]}
                            disabled={loading}
                        >
                            <ThemedText variant="caption" color={Colors.dark.primary} weight="medium">
                                Restore Purchases
                            </ThemedText>
                        </Pressable>
                        <ThemedText variant="caption" color={Colors.dark.textMuted} style={styles.guarantee}>
                            Cancel anytime • Secure payment via Apple/Google
                        </ThemedText>
                    </View>
                </ScrollView>

            </View>

            {/* Success Sheet */}
            <BlurredBottomSheet
                visible={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    router.back();
                }}
                title="Welcome to Echo Pro!"
                subtitle="Your subscription is now active. Enjoy unlimited features."
                actions={[{ label: 'Get Started', tone: 'accent', onPress: () => { setShowSuccess(false); router.back(); } }]}
            />

            {/* Error Sheet */}
            <BlurredBottomSheet
                visible={showError !== null}
                onClose={() => setShowError(null)}
                title="Payment Failed"
                subtitle={showError || ''}
                actions={[{ label: 'Try Again', tone: 'accent', onPress: () => setShowError(null) }]}
            />

            {/* Restore Result Sheet */}
            <BlurredBottomSheet
                visible={showRestoreResult !== null}
                onClose={() => {
                    setShowRestoreResult(null);
                    if (showRestoreResult === 'success') router.back();
                }}
                title={
                    showRestoreResult === 'success' ? 'Purchases Restored' :
                    showRestoreResult === 'none' ? 'No Purchases Found' :
                    'Restore Failed'
                }
                subtitle={
                    showRestoreResult === 'success' ? 'Your Pro subscription has been restored.' :
                    showRestoreResult === 'none' ? 'Could not find any active Pro subscriptions.' :
                    'Failed to restore purchases. Please try again.'
                }
                actions={[{ 
                    label: 'Done', 
                    tone: showRestoreResult === 'success' ? 'accent' : 'default',
                    onPress: () => {
                        setShowRestoreResult(null);
                        if (showRestoreResult === 'success') router.back();
                    }
                }]}
            />
        </Layout>
    );
}

const FeatureItem = ({ icon, text }: { icon: any, text: string }) => (
    <View style={styles.featureRow}>
        <View style={styles.featureIcon}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.dark.success} />
        </View>
        <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    // Header Section
    headerSection: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    iconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(147,197,253,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(147,197,253,0.2)',
    },
    title: {
        fontSize: 36,
        letterSpacing: -0.6,
        marginBottom: 6,
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
    },
    // Features Section
    featuresSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 22,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    features: {
        width: '100%',
        gap: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceElevated,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    featureIcon: {
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        flex: 1,
        lineHeight: 20,
    },
    // Packages Section
    packagesSection: {
        marginBottom: 24,
    },
    packages: {
        width: '100%',
        gap: 12,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        marginBottom: 24,
    },
    packageButton: {
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.dark.surfaceElevated,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: Colors.dark.shadow,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
        minHeight: 88,
    },
    popularButton: {
        backgroundColor: 'rgba(147,197,253,0.12)',
        borderColor: 'rgba(147,197,253,0.35)',
        borderWidth: 2,
        shadowColor: Colors.dark.glow,
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 12,
    },
    selectedButton: {
        borderColor: Colors.dark.primary,
        borderWidth: 2.5,
        backgroundColor: 'rgba(147,197,253,0.1)',
        shadowColor: Colors.dark.primary,
        shadowOpacity: 0.25,
        shadowRadius: 14,
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 16,
        borderRadius: 14,
        overflow: 'visible',
        zIndex: 10,
    },
    badgeGradient: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: Colors.dark.primary,
        borderRadius: 14,
        shadowColor: Colors.dark.primary,
        shadowOpacity: 0.5,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        letterSpacing: 0.8,
        fontWeight: '700',
    },
    packageInfo: {
        flex: 1,
        marginRight: 16,
    },
    packageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 10,
        flexWrap: 'wrap',
    },
    packageTitle: {
        fontSize: 18,
        lineHeight: 24,
    },
    savingsBadge: {
        backgroundColor: Colors.dark.success + '28',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.dark.success + '55',
    },
    savingsText: {
        color: Colors.dark.success,
        fontSize: 11,
        fontWeight: '700',
    },
    packageDesc: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        lineHeight: 18,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    checkIcon: {
        marginRight: 2,
    },
    priceInfo: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    packagePrice: {
        fontSize: 20,
        color: Colors.dark.primary,
        fontWeight: '700',
        lineHeight: 26,
    },
    popularTitle: {
        color: Colors.dark.primary,
    },
    popularDesc: {
        color: Colors.dark.textSecondary,
    },
    popularPrice: {
        color: Colors.dark.primary,
    },
    popularPeriod: {
        color: Colors.dark.textSecondary,
    },
    pricePeriod: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginTop: 3,
        lineHeight: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        marginBottom: 24,
    },
    // CTA Section
    ctaSection: {
        width: '100%',
        marginTop: 24,
        marginBottom: 20,
    },
    ctaButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 18,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.dark.glow,
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    ctaButtonText: {
        color: 'white',
        fontSize: 17,
        letterSpacing: 0.3,
    },
    ctaSubtext: {
        textAlign: 'center',
        marginTop: 10,
        fontSize: 12,
        lineHeight: 18,
    },
    // Footer Section
    footerSection: {
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    restoreButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    guarantee: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 12,
        lineHeight: 18,
        paddingHorizontal: 20,
    }
});
