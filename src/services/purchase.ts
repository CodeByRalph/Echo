import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// Get API key from environment variables (EAS secrets) or fallback to test key
const getRevenueCatApiKey = (): string => {
    // In production builds, use the key from EAS secrets
    const productionKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
    
    // Fallback to test key for development
    const testKey = 'test_UaGbgyycZMSWByKGNzpUurFFxun';
    
    // Use production key if available, otherwise fallback to test key
    return productionKey || testKey;
};

const API_KEY = getRevenueCatApiKey();

export const PurchaseService = {
    init: async () => {
        if (Platform.OS === 'web') {
            console.log('RevenueCat skipped on web');
            return;
        }

        try {
            // Only use DEBUG log level in development
            if (__DEV__) {
                Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            } else {
                Purchases.setLogLevel(Purchases.LOG_LEVEL.INFO);
            }
            
            Purchases.configure({ apiKey: API_KEY });
            console.log('RevenueCat Configured', __DEV__ ? '(Development)' : '(Production)');
        } catch (e) {
            console.error('Error configuring RevenueCat:', e);
            throw e; // Re-throw to allow error boundary to catch it
        }
    },

    getPackages: async (): Promise<PurchasesPackage[]> => {
        if (Platform.OS === 'web') return [];

        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
        } catch (e) {
            console.error('Error fetching offerings:', e);
        }
        return [];
    },

    purchasePackage: async (pack: PurchasesPackage): Promise<boolean> => {
        if (Platform.OS === 'web') return true; // Mock success on web

        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            
            // Log all entitlement information for debugging
            console.log('Purchase completed, checking entitlements:', {
                activeEntitlements: Object.keys(customerInfo.entitlements.active),
                allEntitlements: Object.keys(customerInfo.entitlements.all),
                activeEntitlementsFull: customerInfo.entitlements.active,
                allEntitlementsFull: customerInfo.entitlements.all,
                hasPro: !!customerInfo.entitlements.active['pro'],
                hasProEntitlement: !!customerInfo.entitlements.all['pro'],
                activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
                allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers
            });
            
            // Check for 'pro' entitlement (primary check)
            const hasPro = !!customerInfo.entitlements.active['pro'];
            
            // Also check for any active entitlements (in case entitlement name differs)
            const activeEntitlementKeys = Object.keys(customerInfo.entitlements.active);
            const hasAnyActive = activeEntitlementKeys.length > 0;
            
            // Check if purchase was successful by looking at active subscriptions
            const hasActiveSubscription = Object.keys(customerInfo.activeSubscriptions).length > 0;
            
            // For test purchases, sometimes entitlements sync immediately, sometimes they need a moment
            // If we have an active subscription but no entitlements yet, the purchase likely succeeded
            // but entitlements need to sync
            if (hasPro) {
                console.log('Pro entitlement active - purchase successful');
                return true;
            }
            
            if (hasAnyActive) {
                console.log('Active entitlements found:', activeEntitlementKeys);
                return true;
            }
            
            // If we have active subscriptions but no entitlements, purchase likely succeeded
            // but entitlements are syncing (common in test mode)
            if (hasActiveSubscription) {
                console.log('Active subscription found but no entitlements yet - purchase likely succeeded, syncing...');
                // Return true but note that entitlements may need a moment to sync
                return true;
            }
            
            // No active entitlements or subscriptions - purchase did not succeed
            console.log('Purchase completed but no active entitlements or subscriptions - purchase failed');
            return false;
        } catch (e: any) {
            // Handle user cancellation
            if (e.userCancelled) {
                console.log('Purchase cancelled by user');
                return false;
            }
            
            // Handle test purchase failures (RevenueCat test failure code)
            if (e.code === '5' || e.code === 5 || e.message?.includes('test purchase failure') || e.message?.includes('no real transaction')) {
                console.log('Test purchase failed (expected in test mode):', e.message);
                return false;
            }
            
            // Log other errors for debugging
            console.error('Purchase error:', {
                code: e.code,
                message: e.message,
                error: e,
                stack: e.stack
            });
            return false;
        }
    },

    restorePurchases: async (): Promise<boolean> => {
        if (Platform.OS === 'web') return false;

        try {
            const customerInfo = await Purchases.restorePurchases();
            return !!customerInfo.entitlements.active['pro'];
        } catch (e) {
            console.error('Error restoring purchases:', e);
            return false;
        }
    },

    checkProStatus: async (): Promise<boolean> => {
        if (Platform.OS === 'web') return false; // Default to false on web for safety

        try {
            const customerInfo = await Purchases.getCustomerInfo();
            
            // Log entitlement information for debugging
            const hasPro = !!customerInfo.entitlements.active['pro'];
            const activeEntitlements = Object.keys(customerInfo.entitlements.active);
            const activeSubscriptions = Object.keys(customerInfo.activeSubscriptions);
            
            console.log('Checking Pro status:', {
                hasPro,
                activeEntitlements,
                activeSubscriptions,
                allEntitlements: Object.keys(customerInfo.entitlements.all),
                allPurchasedProducts: customerInfo.allPurchasedProductIdentifiers
            });
            
            // Check for 'pro' entitlement
            if (hasPro) {
                return true;
            }
            
            // Also check if there are any active entitlements (in case entitlement name differs)
            if (activeEntitlements.length > 0) {
                console.log('Found active entitlements (not named "pro"):', activeEntitlements);
                return true;
            }
            
            // Check if there are active subscriptions (entitlements might be syncing)
            if (activeSubscriptions.length > 0) {
                console.log('Found active subscriptions but no entitlements yet:', activeSubscriptions);
                // Return true if subscriptions exist - entitlements may be syncing
                return true;
            }
            
            return false;
        } catch (e) {
            console.error('Error checking pro status:', e);
            return false;
        }
    }
};
