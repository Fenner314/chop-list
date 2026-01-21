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

interface SignupFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { darkMode, themeColor, fontSize } = useSelector(
    (state: RootState) => state.settings
  );

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const password = watch("password");

  const fontSizeValue =
    fontSize === "small" ? 14 : fontSize === "large" ? 20 : 16;

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      await signUp(data.email.trim(), data.password, data.displayName.trim());
      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("email", {
          message: "An account with this email already exists",
        });
      } else if (error.code === "auth/invalid-email") {
        setError("email", { message: "Invalid email address" });
      } else if (error.code === "auth/weak-password") {
        setError("password", { message: "Password is too weak" });
      } else {
        setError("email", { message: "Failed to create account" });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordRequirements = (value: string) => {
    return {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
    };
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <IconSymbol name="chevron.left" size={24} color={themeColor} />
            <Text
              style={[
                styles.backText,
                { color: themeColor, fontSize: fontSizeValue },
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  fontSize: fontSizeValue + 12,
                  color: darkMode ? "#fff" : "#333",
                },
              ]}
            >
              Create Account
            </Text>
            <Text
              style={[
                styles.subtitle,
                { fontSize: fontSizeValue, color: darkMode ? "#999" : "#666" },
              ]}
            >
              Sign up to sync and share your lists
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: darkMode ? "#111" : "#f5f5f5" },
                errors.displayName && styles.inputError,
              ]}
            >
              <IconSymbol
                name="person.fill"
                size={20}
                color={darkMode ? "#666" : "#999"}
              />
              <Controller
                control={control}
                name="displayName"
                rules={{
                  required: "Name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={nameRef}
                    style={[
                      styles.input,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                      },
                    ]}
                    placeholder="Your Name"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                )}
              />
            </View>
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName.message}</Text>
            )}

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
                  validate: (value) => {
                    const reqs = getPasswordRequirements(value);
                    if (!reqs.length) return "At least 8 characters";
                    if (!reqs.uppercase) return "At least 1 uppercase letter";
                    if (!reqs.lowercase) return "At least 1 lowercase letter";
                    if (!reqs.number) return "At least 1 number";
                    if (!reqs.special) return "At least 1 special character";
                    return true;
                  },
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
                    autoComplete="new-password"
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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

            {/* Password Requirements */}
            {password.length > 0 && (
              <View style={styles.requirements}>
                {[
                  { key: "length", label: "8+ characters" },
                  { key: "uppercase", label: "1 uppercase" },
                  { key: "lowercase", label: "1 lowercase" },
                  { key: "number", label: "1 number" },
                  { key: "special", label: "1 special (!@#$...)" },
                ].map(({ key, label }) => {
                  const reqs = getPasswordRequirements(password);
                  const met = reqs[key as keyof typeof reqs];
                  return (
                    <View key={key} style={styles.requirementRow}>
                      <IconSymbol
                        name={met ? "checkmark.circle" : "circle"}
                        size={14}
                        color={met ? "#4CAF50" : darkMode ? "#666" : "#999"}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          {
                            color: met ? "#4CAF50" : darkMode ? "#666" : "#999",
                            fontSize: fontSizeValue - 2,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Confirm Password Input */}
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: darkMode ? "#111" : "#f5f5f5" },
                errors.confirmPassword && styles.inputError,
              ]}
            >
              <IconSymbol
                name="lock.fill"
                size={20}
                color={darkMode ? "#666" : "#999"}
              />
              <Controller
                control={control}
                name="confirmPassword"
                rules={{
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    ref={confirmPasswordRef}
                    style={[
                      styles.input,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                      },
                    ]}
                    placeholder="Confirm Password"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
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
            {errors.confirmPassword && (
              <Text style={styles.errorText}>
                {errors.confirmPassword.message}
              </Text>
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
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View style={styles.signinContainer}>
              <Text
                style={[
                  styles.footerText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#999" : "#666",
                  },
                ]}
              >
                Already have an account?
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
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
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    fontWeight: "500",
    marginLeft: 4,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontWeight: "bold",
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
  requirements: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
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
  linkText: {
    fontWeight: "500",
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  signinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {},
});
