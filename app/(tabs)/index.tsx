import "@/global.css"
import "@/global.css"
import { Text, View} from "react-native";
import {Link} from "expo-router";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "react-native-css";
const SafeAreaView = styled(RNSafeAreaView);
export default function App() {
    return (
        <SafeAreaView
        className={"flex-1 items-center justify-center bg-neutral-100"}>
            <Text className="text-xl font-bold text-success">
                Welcome to Nativewind!
            </Text>
            <Link href="/onboarding" className={"mt-4 rounded bg-primary text-white p-4"}> tap to onboard</Link>
            <Link href="/(auth)/Sign-up" className={"mt-4 rounded bg-primary text-white p-4"}> go to sign-up</Link>
            <Link href="/(auth)/Sign-in" className={"mt-4 rounded bg-primary text-white p-4"}> go to sign-in</Link>
            <Link href="/app/subscriptions/spotiy"> spotiy subscription</Link>
            <Link href="/app/subscriptions/spotiy"> spotiy subscription</Link>
            <Link
                href={{
                   pathname: "/subscriptions/[id]",
                    params: {id: "claude"}
                }}> claude subs</Link>
        </SafeAreaView>
    );
}