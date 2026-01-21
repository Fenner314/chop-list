import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import { RootState } from "@/store";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { darkMode, themeColor, fontSize } = useSelector(
    (state: RootState) => state.settings
  );

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const fontSizeValue =
    fontSize === "small" ? 14 : fontSize === "large" ? 20 : 16;

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await signIn(data.email.trim(), data.password);
      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setError("email", { message: "No account found with this email" });
      } else if (error.code === "auth/wrong-password") {
        setError("password", { message: "Incorrect password" });
      } else if (error.code === "auth/invalid-email") {
        setError("email", { message: "Invalid email address" });
      } else if (error.code === "auth/too-many-requests") {
        setError("email", {
          message: "Too many attempts. Please try again later",
        });
      } else if (error.code === "auth/invalid-credential") {
        setError("password", { message: "Invalid email or password" });
      } else {
        setError("email", { message: "Failed to sign in" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithoutAccount = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <IconSymbol name="cart.fill" size={60} color={themeColor} />
            <Text
              style={[
                styles.title,
                {
                  fontSize: fontSizeValue + 16,
                  color: darkMode ? "#fff" : "#333",
                },
              ]}
            >
              Chop List
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: fontSizeValue, color: darkMode ? "#999" : "#666" },
              ]}
            >
              Sign in to sync your lists
            </Text>
          </View>

          <View style={styles.form}>
            {/* Email Input */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: darkMode ? "#111" : "#f5f5f5" },
                errors.email && styles.inputError,
              ]}
            >
              <IconSymbol
                name="envelope.fill"
                size={20}
                color={darkMode ? "#666" : "#999"}
              />
              <Controller
                control={control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={emailRef}
                    style={[
                      styles.input,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                      },
                    ]}
                    placeholder="Email"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}

            {/* Password Input */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: darkMode ? "#111" : "#f5f5f5" },
                errors.password && styles.inputError,
              ]}
            >
              <IconSymbol
                name="lock.fill"
                size={20}
                color={darkMode ? "#666" : "#999"}
              />
              <Controller
                control={control}
                name="password"
                rules={{
                  required: "Password is required",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={passwordRef}
                    style={[
                      styles.input,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                      },
                    ]}
                    placeholder="Password"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <IconSymbol
                  name={showPassword ? "eye.slash.fill" : "eye.fill"}
                  size={20}
                  color={darkMode ? "#666" : "#999"}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColor }]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[styles.buttonText, { fontSize: fontSizeValue + 2 }]}
                >
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
              disabled={loading}
              style={styles.forgotPassword}
            >
              <Text
                style={[
                  styles.linkText,
                  { fontSize: fontSizeValue - 2, color: themeColor },
                ]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.signupContainer}>
              <Text
                style={[
                  styles.footerText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#999" : "#666",
                  },
                ]}
              >
                Don't have an account?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.linkText,
                    {
                      fontSize: fontSizeValue,
                      color: themeColor,
                      marginLeft: 4,
                    },
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: darkMode ? "#333" : "#ddd" },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  {
                    fontSize: fontSizeValue - 2,
                    color: darkMode ? "#666" : "#999",
                    backgroundColor: darkMode ? "#000" : "#fff",
                  },
                ]}
              >
                or
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: darkMode ? "#333" : "#ddd" },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: darkMode ? "#333" : "#ddd",
                  backgroundColor: darkMode ? "#111" : "#f9f9f9",
                },
              ]}
              onPress={handleContinueWithoutAccount}
              disabled={loading}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Continue Without Account
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.noteText,
                {
                  fontSize: fontSizeValue - 4,
                  color: darkMode ? "#666" : "#999",
                },
              ]}
            >
              Your lists will be stored locally on this device
            </Text>
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
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontWeight: "bold",
    marginTop: 16,
  },
  subtitle: {
    marginTop: 8,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
    gap: 12,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#f44336",
  },
  input: {
    flex: 1,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontWeight: "500",
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  footerText: {},
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontWeight: "500",
  },
  noteText: {
    textAlign: "center",
  },
});
