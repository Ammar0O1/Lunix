import React, { useState } from 'react'
import { Alert, ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "react-native-css";
import { useClerk, useUser } from "@clerk/expo";
import Constants from 'expo-constants';
import '@/global.css';
import { usePostHog } from 'posthog-react-native';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import images from '@/constants/images';
import { colors } from '@/constants/theme';

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const posthog = usePostHog();
  const { clearSubscriptions } = useSubscriptions();

  const displayName = user?.username ?? user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? '';
  const email = user?.emailAddresses[0]?.emailAddress ?? '';

  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  async function handleUpdateUsername() {
    const trimmed = newUsername.trim();
    if (!trimmed) { setUsernameError('Username is required.'); return; }
    if (trimmed.length < 3) { setUsernameError('At least 3 characters required.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setUsernameError('Only letters, numbers, and underscores.'); return; }
    setIsSavingUsername(true);
    try {
      await user?.update({ username: trimmed });
      setNewUsername('');
      setUsernameError('');
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (e: any) {
      const msg =
        e?.errors?.[0]?.longMessage ??
        e?.errors?.[0]?.message ??
        e?.message ??
        'Failed to update username.';
      setUsernameError(msg);
    } finally {
      setIsSavingUsername(false);
    }
  }

  function handleClearAll() {
    Alert.alert(
      'Clear All Subscriptions',
      'This will remove all subscriptions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearSubscriptions },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text className="list-title mb-6">Settings</Text>

        {/* Profile */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image
            source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
            style={{ width: 52, height: 52, borderRadius: 26 }}
          />
          <View style={{ flex: 1 }}>
            {displayName ? <Text className="sub-title" numberOfLines={1}>{displayName}</Text> : null}
            {email ? <Text className="sub-meta" numberOfLines={1}>{email}</Text> : null}
          </View>
        </View>

        {/* Username */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text className="sub-label mb-3">Change Username</Text>
          <Text className="sub-meta mb-2">Current: <Text className="sub-value">{user?.username ? `@${user.username}` : 'Not set'}</Text></Text>
          <TextInput
            className={usernameError ? 'auth-input auth-input-error' : 'auth-input'}
            placeholder="New username"
            placeholderTextColor="rgba(8,17,38,0.25)"
            value={newUsername}
            onChangeText={(v) => { setNewUsername(v); setUsernameError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {usernameError ? <Text className="auth-error mt-1">{usernameError}</Text> : null}
          {usernameSuccess ? <Text style={{ color: 'green', fontSize: 13, marginTop: 4 }}>Username updated successfully.</Text> : null}
          <TouchableOpacity
            style={{
              backgroundColor: !newUsername.trim() || isSavingUsername ? `${colors.accent}70` : colors.accent,
              borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 10,
            }}
            onPress={handleUpdateUsername}
            disabled={!newUsername.trim() || isSavingUsername}
            activeOpacity={0.8}
          >
            {isSavingUsername
              ? <ActivityIndicator color="#081126" size="small" />
              : <Text style={{ color: '#081126', fontWeight: '600', fontSize: 15 }}>Save Username</Text>}
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text className="sub-label mb-3">About</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text className="sub-label">App</Text>
            <Text className="sub-value">{Constants.expoConfig?.name ?? '—'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text className="sub-label">Version</Text>
            <Text className="sub-value">{Constants.expoConfig?.version ?? '—'}</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text className="sub-label mb-3">Danger Zone</Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.destructive, borderRadius: 12, padding: 14, alignItems: 'center' }}
            onPress={handleClearAll}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Clear All Subscriptions</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <TouchableOpacity
          className="auth-button"
          onPress={() => { posthog.capture('sign_out_tapped'); signOut(); }}
          activeOpacity={0.8}
        >
          <Text className="auth-button-text">Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Settings
