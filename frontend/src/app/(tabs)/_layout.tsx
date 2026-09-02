import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/components/ui/tab-bar';
import { useTheme } from '@/hooks/use-theme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
      <Tabs.Screen name="approved" options={{ title: 'Approved' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
