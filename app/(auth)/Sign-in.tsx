import React, { useState } from 'react';
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
import { useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import clsx from 'clsx';
import '@/global.css';
import AuthBrand from '@/components/AuthBrand';
import { usePostHog } from 'posthog-react-native';

const SafeAreaView = styled(RNSafeAreaView);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const router = useRouter();
  const posthog = usePostHog();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = fetchStatus === 'fetching';

  function clearFieldError(field: string) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validateForm() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function finalize() {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) return;
        router.replace('/(tabs)' as Href);
      },
    });
  }

  async function handleSignIn() {
    if (!validateForm()) return;
    posthog.capture('sign_in_submitted');
    const { error } = await signIn.password({ emailAddress: email.trim(), password });
    if (error) {
      posthog.capture('sign_in_failed');
      return;
    }

    if (signIn.status === 'complete') {
      posthog.capture('sign_in_succeeded');
      await finalize();
    } else if (signIn.status === 'needs_client_trust') {
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === 'email_code',
      );
      if (emailFactor) {
        await signIn.mfa.sendEmailCode();
        posthog.capture('sign_in_mfa_required');
        setStep('verify');
      } else {
        posthog.capture('sign_in_failed', { reason: 'no_mfa_method' });
        setErrors({ password: 'Additional verification is required but no supported method is available.' });
      }
    }
  }

  async function handleVerify() {
    if (!code.trim()) {
      setErrors({ code: 'Enter the 6-digit code sent to your email.' });
      return;
    }
    posthog.capture('sign_in_mfa_verify_submitted');
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      posthog.capture('sign_in_succeeded');
      await finalize();
    }
  }

  // ── MFA / client-trust verify step ───────────────────────────────────────
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

            <Text className="auth-title text-center mt-4">Verify it's you</Text>
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
                </View>

                <TouchableOpacity
                  className={clsx('auth-button', isLoading && 'auth-button-disabled')}
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading
                    ? <ActivityIndicator color="#081126" size="small" />
                    : <Text className="auth-button-text">Verify</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  className="auth-secondary-button"
                  onPress={() => { posthog.capture('sign_in_mfa_resend_tapped'); signIn.mfa.sendEmailCode(); }}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text className="auth-secondary-button-text">Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="auth-link-row"
              onPress={() => { posthog.capture('sign_in_mfa_go_back_tapped'); signIn.reset(); setStep('form'); setCode(''); setErrors({}); }}
              activeOpacity={0.7}
            >
              <Text className="auth-link-copy">Want to start over?</Text>
              <Text className="auth-link">Go back</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Sign-in form ──────────────────────────────────────────────────────────
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

          <Text className="auth-title text-center mt-4">Welcome back</Text>
          <Text className="auth-subtitle">Sign in to manage your subscriptions.</Text>

          <View className="auth-card">
            <View className="auth-form">

              {/* Email */}
              <View className="auth-field">
                <Text className="auth-label">Email address</Text>
                <TextInput
                  className={clsx(
                    'auth-input',
                    (errors.email || clerkErrors.fields.identifier) && 'auth-input-error',
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
                {(errors.email || clerkErrors.fields.identifier) && (
                  <Text className="auth-error">
                    {errors.email || clerkErrors.fields.identifier?.message}
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
                  placeholder="Your password"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                {(errors.password || clerkErrors.fields.password) && (
                  <Text className="auth-error">
                    {errors.password || clerkErrors.fields.password?.message}
                  </Text>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity
                className={clsx(
                  'auth-button',
                  (!email || !password || isLoading) && 'auth-button-disabled',
                )}
                onPress={handleSignIn}
                disabled={!email || !password || isLoading}
                activeOpacity={0.8}
              >
                {isLoading
                  ? <ActivityIndicator color="#081126" size="small" />
                  : <Text className="auth-button-text">Sign in</Text>}
              </TouchableOpacity>

            </View>
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">Don't have an account?</Text>
            <Link href="/(auth)/Sign-up">
              <Text className="auth-link">Create one</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
