import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "react-native-css";
import { useClerk } from "@clerk/expo";
import '@/global.css';

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="list-title mb-8">Settings</Text>

      <TouchableOpacity
        className="auth-button"
        onPress={() => signOut()}
        activeOpacity={0.8}
      >
        <Text className="auth-button-text">Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default Settings