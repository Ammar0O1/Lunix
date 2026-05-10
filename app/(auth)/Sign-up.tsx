import React, { useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'react-native-css';
import { useSignUp } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import clsx from 'clsx';
import '@/global.css';
import AuthBrand from '@/components/AuthBrand';

const SafeAreaView = styled(RNSafeAreaView);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const router = useRouter();
  const posthog = usePostHog();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = fetchStatus === 'fetching';

  function clearFieldError(field: string) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validateForm() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Username is required.';
    else if (username.trim().length < 3) e.username = 'Username must be at least 3 characters.';
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) e.username = 'Only letters, numbers, and underscores allowed.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!confirm) e.confirm = 'Please confirm your password.';
    else if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignUp() {
    if (!validateForm()) return;
    posthog.capture('sign_up_submitted');
    const { error } = await signUp.password({ emailAddress: email.trim(), password, username: username.trim() });
    if (error) {
      posthog.capture('sign_up_failed');
      return;
    }
    // Clerk auto-sends the verification email on password sign-up when email
    // verification is required. Move to the verify step immediately and fire
    // sendEmailCode() as a non-blocking fallback in case it wasn't auto-sent.
    setStep('verify');
    signUp.verifications.sendEmailCode().catch(console.error);
  }

  async function handleVerify() {
    if (!code.trim()) {
      setErrors({ code: 'Enter the 6-digit code sent to your email.' });
      return;
    }
    posthog.capture('sign_up_email_verify_submitted');
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      posthog.capture('sign_up_succeeded');
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.replace('/(tabs)' as Href);
        },
      });
    }
  }

  // ── Email verification step ───────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="auth-scroll"
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthBrand />

            <Text className="auth-title text-center mt-4">Check your inbox</Text>
            <Text className="auth-subtitle">
              We sent a 6-digit code to{'\n'}
              <Text className="font-sans-bold text-primary">{email}</Text>
            </Text>

            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={clsx(
                      'auth-input',
                      (errors.code || clerkErrors.fields.code) && 'auth-input-error',
                    )}
                    style={{ textAlign: 'center', fontSize: 22, letterSpacing: 10, paddingVertical: 20 }}
                    placeholder="000000"
                    placeholderTextColor="rgba(8,17,38,0.25)"
                    value={code}
                    onChangeText={(v) => { setCode(v); clearFieldError('code'); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  {(errors.code || clerkErrors.fields.code) && (
                    <Text className="auth-error">
                      {errors.code || clerkErrors.fields.code?.message}
                    </Text>
                  )}
                  <Text className="auth-helper">Didn't get it? Check your spam folder.</Text>
                </View>

                <TouchableOpacity
                  className={clsx('auth-button', isLoading && 'auth-button-disabled')}
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading
                    ? <ActivityIndicator color="#081126" size="small" />
                    : <Text className="auth-button-text">Verify email</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  className="auth-secondary-button"
                  onPress={() => { posthog.capture('sign_up_resend_code_tapped'); signUp.verifications.sendEmailCode(); }}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text className="auth-secondary-button-text">Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="auth-link-row"
              onPress={() => { setStep('form'); setCode(''); }}
              activeOpacity={0.7}
            >
              <Text className="auth-link-copy">Wrong email?</Text>
              <Text className="auth-link">Go back</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="auth-scroll"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthBrand />

          <Text className="auth-title text-center mt-4">Create account</Text>
          <Text className="auth-subtitle">Track every subscription in one place.</Text>

          <View className="auth-card">
            <View className="auth-form">

              {/* Username */}
              <View className="auth-field">
                <Text className="auth-label">Username</Text>
                <TextInput
                  className={clsx('auth-input', errors.username && 'auth-input-error')}
                  placeholder="e.g. john_doe"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={username}
                  onChangeText={(v) => { setUsername(v); clearFieldError('username'); }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {errors.username
                  ? <Text className="auth-error">{errors.username}</Text>
                  : <Text className="auth-helper">Letters, numbers, and underscores only</Text>}
              </View>

              {/* Email */}
              <View className="auth-field">
                <Text className="auth-label">Email address</Text>
                <TextInput
                  className={clsx(
                    'auth-input',
                    (errors.email || clerkErrors.fields.emailAddress) && 'auth-input-error',
                  )}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
                {(errors.email || clerkErrors.fields.emailAddress) && (
                  <Text className="auth-error">
                    {errors.email || clerkErrors.fields.emailAddress?.message}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <TextInput
                  className={clsx(
                    'auth-input',
                    (errors.password || clerkErrors.fields.password) && 'auth-input-error',
                  )}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                />
                {(errors.password || clerkErrors.fields.password) ? (
                  <Text className="auth-error">
                    {errors.password || clerkErrors.fields.password?.message}
                  </Text>
                ) : (
                  <Text className="auth-helper">At least 8 characters</Text>
                )}
              </View>

              {/* Confirm password */}
              <View className="auth-field">
                <Text className="auth-label">Confirm password</Text>
                <TextInput
                  className={clsx('auth-input', errors.confirm && 'auth-input-error')}
                  placeholder="Re-enter your password"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={confirm}
                  onChangeText={(v) => { setConfirm(v); clearFieldError('confirm'); }}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                {errors.confirm && <Text className="auth-error">{errors.confirm}</Text>}
              </View>

              {/* Submit */}
              <TouchableOpacity
                className={clsx(
                  'auth-button',
                  (!username || !email || !password || !confirm || isLoading) && 'auth-button-disabled',
                )}
                onPress={handleSignUp}
                disabled={!username || !email || !password || !confirm || isLoading}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color="#081126" size="small" />
                  : <Text className="auth-button-text">Create account</Text>}
              </TouchableOpacity>

            </View>
          </View>

          {/* Required for Clerk's bot-signup protection */}
          <View nativeID="clerk-captcha" />

          <View className="auth-link-row">
            <Text className="auth-link-copy">Already have an account?</Text>
            <Link href="/(auth)/Sign-in">
              <Text className="auth-link">Sign in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
