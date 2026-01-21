import { Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function AuthLayout() {
  const darkMode = useSelector((state: RootState) => state.settings.darkMode);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: darkMode ? '#000' : '#fff',
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
