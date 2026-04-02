import React from 'react'
import { View, Text } from 'react-native'
import {Link} from "expo-router";

const SignUp = () => {
    return (
        <View>
            <Text>Sign-up</Text>
            <Link href="/(auth)/Sign-in">Have an Account?</Link>
        </View>
    )
}

export default SignUp