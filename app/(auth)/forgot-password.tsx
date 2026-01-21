import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { darkMode, themeColor, fontSize } = useSelector(
    (state: RootState) => state.settings
  );

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (error: any) {
      let message = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}
      >
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: themeColor + '20' }]}>
            <IconSymbol name="envelope.badge.fill" size={48} color={themeColor} />
          </View>
          <Text
            style={[
              styles.successTitle,
              { fontSize: fontSizeValue + 8, color: darkMode ? '#fff' : '#333' },
            ]}
          >
            Check Your Email
          </Text>
          <Text
            style={[
              styles.successText,
              { fontSize: fontSizeValue, color: darkMode ? '#999' : '#666' },
            ]}
          >
            We've sent a password reset link to {email}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColor }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { fontSize: fontSizeValue + 2 }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={themeColor}
            />
            <Text style={[styles.backText, { color: themeColor, fontSize: fontSizeValue }]}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { fontSize: fontSizeValue + 12, color: darkMode ? '#fff' : '#333' },
              ]}
            >
              Reset Password
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: fontSizeValue, color: darkMode ? '#999' : '#666' },
              ]}
            >
              Enter your email and we'll send you a link to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: darkMode ? '#111' : '#f5f5f5' },
              ]}
            >
              <IconSymbol
                name="envelope.fill"
                size={20}
                color={darkMode ? '#666' : '#999'}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? '#fff' : '#333',
                  },
                ]}
                placeholder="Email"
                placeholderTextColor={darkMode ? '#666' : '#999'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColor }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { fontSize: fontSizeValue + 2 }]}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    fontWeight: '500',
    marginLeft: 4,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 22,
  },
  form: {},
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
});
