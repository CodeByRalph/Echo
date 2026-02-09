import '../sentry.config';
import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Sentry from '@sentry/react-native';
import { Colors } from '../src/constants/Colors';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { supabase } from '../src/lib/supabase';
import { NotificationService } from '../src/services/notifications';
import { PurchaseService } from '../src/services/purchase';
import { useStore } from '../src/store/useStore';

export default function RootLayout() {
  const reminders = useStore((state) => state.reminders);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    // Initialize services with error handling
    (async () => {
      try {
        await NotificationService.init();
      } catch (e) {
        console.error('NotificationService init failed:', e);
        if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
          Sentry.captureException(e, { tags: { service: 'notifications' } });
        }
      }

      try {
        await PurchaseService.init();
        // Check pro status after RevenueCat is initialized
        try {
          await useStore.getState().checkProStatus();
        } catch (e) {
          console.error('Pro status check failed:', e);
          if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
            Sentry.captureException(e, { tags: { service: 'revenuecat', action: 'checkProStatus' } });
          }
        }
      } catch (e) {
        console.error('PurchaseService init failed:', e);
        if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
          Sentry.captureException(e, { tags: { service: 'revenuecat', action: 'init' } });
        }
      }
    })();

    // Auth Listener with error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setInitialized(true);
        // Set user context in Sentry if logged in
        if (session?.user && process.env.EXPO_PUBLIC_SENTRY_DSN) {
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
          });
        }
      })
      .catch(e => {
        console.error('Failed to get session:', e);
        if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
          Sentry.captureException(e, { tags: { service: 'supabase', action: 'getSession' } });
        }
        setInitialized(true); // Still mark as initialized to allow app to continue
      });

    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session?.user) {
          // Reset state first to clear any old user data, then hydrate
          const currentUserId = useStore.getState().userId;
          if (currentUserId && currentUserId !== session.user.id) {
            useStore.getState().resetState();
          }

          useStore.getState().hydrate().catch(e => {
            console.error('Hydration failed:', e);
            if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
              Sentry.captureException(e, { tags: { service: 'store', action: 'hydrate' } });
            }
          });
        } else {
          // Reset store locally without triggering another auth sign out
          useStore.getState().resetState();
        }
      });
      subscription = authSubscription;
    } catch (e) {
      console.error('Failed to set up auth listener:', e);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!session && !inAuthGroup) {
      // Redirect to login if no session and not already there
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Redirect to home if logged in and on login screen
      router.replace('/');
    }
  }, [session, segments, initialized, router]);

  useEffect(() => {
    // Whenever reminders change, resync notifications.
    try {
      NotificationService.resyncNotifications(reminders, useStore.getState().settings.notifications_enabled).catch(e => {
        console.error('Failed to resync notifications:', e);
        if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
          Sentry.captureException(e, { tags: { service: 'notifications', action: 'resync' } });
        }
      });
    } catch (e) {
      console.error('Error resyncing notifications:', e);
      if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
        Sentry.captureException(e, { tags: { service: 'notifications', action: 'resync' } });
      }
    }
  }, [reminders]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Reminder' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="snooze-settings" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="category/create" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="family/setup" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
          <Stack.Screen name="stream/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="stream/create" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
