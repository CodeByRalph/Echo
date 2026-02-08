import { Session } from '@supabase/supabase-js';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/constants/Colors';
import { supabase } from '../src/lib/supabase';
import { NotificationService } from '../src/services/notifications';
import { useStore } from '../src/store/useStore';

export default function RootLayout() {
  const reminders = useStore((state) => state.reminders);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    NotificationService.init();

    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Reset state first to clear any old user data, then hydrate
        // Wait for next tick to ensure state is cleared? No, set is asyncish but zustand is synchronous for non-async actions.
        // However, to be safe, we can just call hydrate which now sets the user ID.
        // Actually, if we switch users, we should probably reset first.
        const currentUserId = useStore.getState().userId;
        if (currentUserId && currentUserId !== session.user.id) {
          useStore.getState().resetState();
        }

        useStore.getState().hydrate().catch(e => console.error('Hydration failed:', e));
      } else {
        // Reset store locally without triggering another auth sign out
        useStore.getState().resetState();
      }
    });

    return () => subscription.unsubscribe();
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
  }, [session, segments, initialized]);

  useEffect(() => {
    // Whenever reminders change, resync notifications.
    NotificationService.resyncNotifications(reminders, useStore.getState().settings.notifications_enabled);
  }, [reminders]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.dark.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'New Reminder' }} />
        <Stack.Screen name="snooze-settings" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
        <Stack.Screen name="stream/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="stream/create" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
