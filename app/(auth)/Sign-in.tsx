import React from 'react'
import { View, Text } from 'react-native'
import {Link} from "expo-router";

const SignIn = () => {
  return (
    <View>
      <Text>Sign-in</Text>
        <Link href="/(auth)/Sign-up">create account</Link>
    </View>
  )
}

export default SignIn