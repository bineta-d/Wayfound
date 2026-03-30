import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Link, Tabs, router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { supabase } from '../../lib/supabase';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const notificationStore = globalThis as typeof globalThis & {
  __wayfoundNotifications?: Array<{
    id: string;
    title: string;
    body: string;
    tripId: string;
    createdAt: string;
  }>;
};

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return;
  }
  

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Expo push token:', token.data);
  } catch (error) {
    console.log('Error getting Expo push token:', error);
  }
}

async function saveIncomingNotification(content: Notifications.NotificationContent) {
  const title = typeof content.title === 'string' ? content.title : 'New notification';
  const body = typeof content.body === 'string' ? content.body : 'You have a new update.';
  const tripId = typeof content.data?.tripId === 'string' ? content.data.tripId : '';

  if (!tripId) return;

  const newNotification = {
    id: `${Date.now()}`,
    title,
    body,
    tripId,
    createdAt: new Date().toISOString(),
  };

  const existing = notificationStore.__wayfoundNotifications ?? [];
  notificationStore.__wayfoundNotifications = [newNotification, ...existing];

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log('Could not get user for notification save:', userError?.message ?? 'No user');
    return;
  }

  const { error: insertError } = await supabase.from('notifications').insert({
    user_id: user.id,
    title,
    body,
    trip_id: tripId,
  });

  if (insertError) {
    console.log('Error saving notification to Supabase:', insertError.message);
  } else {
    console.log('Notification saved to Supabase');
  }
}

export default function TabLayout() {
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // TEMP: local test notification
    const setupTestNotification = async () => {
      await registerForPushNotificationsAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This should open a trip 👀',
          data: { tripId: '92e04d25-9a6b-4386-9ffc-641cf7eec790' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
    };

    // setupTestNotification();

    receivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      void saveIncomingNotification(notification.request.content);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;

      const tripId = typeof content.data?.tripId === 'string' ? content.data.tripId : '';
      if (tripId) {
        router.push(`/trip/${tripId}`);
      }
    });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <View style={styles.headerIconsContainer}>
              <Link href="/notifications" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="bell"
                      size={23}
                      color="#000"
                      style={{ marginRight: 14, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>

              <Link href="/modal/add-activity" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color="#000"
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={[styles.createTabIcon, { backgroundColor: color }]}>
              <FontAwesome name="plus" size={20} color="white" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="collaborate"
        options={{
          title: 'Collaborate',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
});