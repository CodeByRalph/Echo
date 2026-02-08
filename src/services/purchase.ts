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
            if (customerInfo.entitlements.active['pro']) {
                return true;
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('Purchase error:', e);
            }
        }
        return false;
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
