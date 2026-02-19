import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFigmaColors } from '@/lib/figma-colors';
import { Typography } from '@/lib/ui/Typography';
import { Button } from '@/lib/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { toast } from '@/lib/ui/toast';

const { width, height } = Dimensions.get('window');

/**
 * SignInScreen - Authentication screen with social login and email/password
 * Based on Baysis design
 */
export default function SignInScreen() {
  const c = useFigmaColors();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    contentContainer: {
      width: '100%',
      maxWidth: 420,
      alignItems: 'center',
    },
    // Blur background effect (simulated with a gradient)
    blurBackground: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -300 }, { translateY: -300 }],
      width: 600,
      height: 600,
      borderRadius: 300,
      backgroundColor: c.accent,
      opacity: 0.05,
    },
    logoContainer: {
      width: 112,
      height: 112,
      borderRadius: 28,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 40,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
      elevation: 12,
    },
    logoText: {
      fontSize: 40,
      fontWeight: '700' as const,
      color: '#0b0b0f',
    },
    title: {
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: c.textSecondary,
      marginBottom: 48,
    },
    socialButton: {
      width: '100%',
      height: 52,
      borderRadius: 24,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 24,
    },
    socialButtonText: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: c.text,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: c.border,
    },
    dividerText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: c.textSecondary,
    },
    inputGroup: {
      marginBottom: 24,
    },
    inputContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: c.text,
      marginBottom: 8,
    },
    input: {
      width: '100%',
      height: 52,
      borderRadius: 24,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      fontSize: 17,
      color: c.text,
      paddingLeft: 56,
    },
    inputIcon: {
      position: 'absolute',
      left: 20,
      top: 38,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 32,
    },
    forgotPasswordText: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: c.accent,
    },
    signInButton: {
      width: '100%',
      height: 52,
      borderRadius: 24,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    signInButtonGradient: {
      backgroundColor: c.accent,
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 8,
    },
    signInButtonText: {
      fontSize: 18,
      fontWeight: '900' as const,
      color: '#0b0b0f',
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 4,
      marginTop: 40,
    },
    signupText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: c.textSecondary,
    },
    signupLink: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: c.accent,
    },
  });

  return (
    <View style={styles.container}>
      {/* Blur background effect */}
      <View style={styles.blurBackground} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>B</Text>
          </View>

          {/* Title */}
          <Typography variant="display" style={styles.title}>
            Baysis
          </Typography>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Welcome back</Text>

          {/* Social Login Buttons */}
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={24} color={c.text} />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton}>
            <View style={{ width: 24, height: 24 }}>
              {/* Google Icon - using a placeholder */}
              <Ionicons name="logo-google" size={24} color={c.text} />
            </View>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email and Password Inputs */}
          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View>
                <Ionicons
                  name="mail"
                  size={20}
                  color={c.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={c.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={c.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={c.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: 38,
                  }}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={c.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, styles.signInButtonGradient, loading && { opacity: 0.6 }]}
            disabled={loading}
            onPress={async () => {
              if (!email || !password) {
                toast.error('Please enter email and password');
                return;
              }
              setLoading(true);
              try {
                await login(email.trim(), password);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Login failed');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.signInButtonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to Baysis?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
