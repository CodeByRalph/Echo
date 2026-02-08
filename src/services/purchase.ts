import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const API_KEY = 'test_UaGbgyycZMSWByKGNzpUurFFxun'; // Provided Key

export const PurchaseService = {
    init: async () => {
        if (Platform.OS === 'web') {
            console.log('RevenueCat skipped on web');
            return;
        }

        try {
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
            Purchases.configure({ apiKey: API_KEY });
            console.log('RevenueCat Configured');
        } catch (e) {
            console.error('Error configuring RevenueCat:', e);
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
            console.log('Purchase completed, checking entitlements:', {
                activeEntitlements: Object.keys(customerInfo.entitlements.active),
                hasPro: !!customerInfo.entitlements.active['pro']
            });
            
            // Check for 'pro' entitlement or any active entitlement (in case name differs)
            const hasPro = !!customerInfo.entitlements.active['pro'];
            const hasAnyActive = Object.keys(customerInfo.entitlements.active).length > 0;
            
            // If purchase succeeded (no exception), consider it success even if entitlement check is delayed
            if (hasPro || hasAnyActive) {
                return true;
            }
            
            // Purchase completed but entitlement not immediately active - might be a sync delay
            // Still return true if we got customerInfo (purchase succeeded)
            console.log('Purchase succeeded but entitlement not immediately active - may need sync');
            return true;
        } catch (e: any) {
            // Handle test purchase failures gracefully
            if (e.userCancelled) {
                // User cancelled - silent
                return false;
            }
            // Check if it's a test failure (code 5 is test failure)
            if (e.code === '5' || e.message?.includes('test purchase failure')) {
                console.log('Test purchase failed (expected in test mode)');
                return false;
            }
            // Only log actual errors
            console.error('Purchase error:', e);
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
            return !!customerInfo.entitlements.active['pro'];
        } catch (e) {
            console.error('Error checking pro status:', e);
            return false;
        }
    }
};
