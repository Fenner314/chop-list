import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor, RootState } from '@/store';
import { CustomSplashScreen } from '@/components/splash-screen';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const darkMode = useSelector((state: RootState) => state.settings.darkMode);

  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={<CustomSplashScreen />} persistor={persistor}>
        <RootLayoutContent />
      </PersistGate>
    </Provider>
  );
}
