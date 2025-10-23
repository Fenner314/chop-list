import { Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setLastVisitedTab } from '@/store/slices/settingsSlice';

export default function TabLayout() {
  const dispatch = useAppDispatch();
  const themeColor = useAppSelector(state => state.settings.themeColor);
  const darkMode = useAppSelector(state => state.settings.darkMode);
  const lastVisitedTab = useAppSelector(state => state.settings.lastVisitedTab);
  const pathname = usePathname();

  // Track tab changes (excluding settings)
  useEffect(() => {
    const currentTab = pathname.replace('/(tabs)/', '').replace('/', '');
    if (currentTab === 'shopping-list' || currentTab === 'pantry-list' || currentTab === 'recipes') {
      dispatch(setLastVisitedTab(currentTab));
    }
  }, [pathname, dispatch]);

  return (
    <Tabs
      initialRouteName={lastVisitedTab}
      screenOptions={{
        tabBarActiveTintColor: themeColor || Colors[darkMode ? 'dark' : 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: darkMode ? '#000' : '#fff',
        },
      }}>
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry-list"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="archivebox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
