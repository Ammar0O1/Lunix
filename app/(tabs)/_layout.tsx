import { Tabs, Redirect } from "expo-router";
import {View, Image} from "react-native";
import { BlurView } from "expo-blur";
import clsx from "clsx";
import {tabs} from "@/constants/data";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {colors, components} from "@/constants/theme";
import { useAuth } from "@clerk/expo";
import { SubscriptionsProvider } from "@/context/SubscriptionsContext";

interface TabIconProps {
    focused: boolean;
    icon: any;
}
const tabBar = components.tabBar;
const TabLayout = () => {
        const { isSignedIn, isLoaded } = useAuth();
        const insets = useSafeAreaInsets();

        if (!isLoaded) return null;
        if (!isSignedIn) return <Redirect href="/(auth)/Sign-in" />;
        const TabIcons = ({focused, icon}: TabIconProps) => {
                return (
                    <View className={"tabs-icon"}>
                            <View className={clsx('tabs-pill', focused &&
                                'tabs-active')}>
                                    <Image source = {icon} resizeMode={"contain"} className="tabs-glyph"/>
                            </View>
                    </View>
                )
        }
           return ( <SubscriptionsProvider><Tabs screenOptions={{
               headerShown: false,
                   lazy:true,
               tabBarShowLabel: false,
               tabBarStyle: {
               position: 'absolute',
              bottom: Math.max(insets.bottom,tabBar.horizontalInset),
               height: tabBar.height,
               marginHorizontal: tabBar.horizontalInset,
               borderRadius: tabBar.radius,
               backgroundColor: 'transparent',
               borderTopWidth: 0,
               elevation: 0,
               overflow: 'hidden',
               borderWidth: 0.5,
               borderColor: 'rgba(255,255,255,0.15)',
                },
               tabBarBackground: () => (
                   <BlurView
                       intensity={80}
                       tint="dark"
                       style={{ flex: 1, backgroundColor: 'rgba(8,17,38,0.55)' }}
                   />
               ),
                   tabBarItemStyle: {
                   paddingVertical: tabBar.height /2 - tabBar.
                       iconFrame /1.6
                   },
                   tabBarIconStyle: {
                   width: tabBar.iconFrame,
                   height: tabBar.iconFrame,
                       alignItems: 'center',
                   },
               }}>
                    {tabs.map((tab) => (
                        <Tabs.Screen
                            key={tab.name}
                            name={tab.name}
                            options={{
                                    title: tab.title,
                                tabBarIcon: ({focused}) =>
                                    <TabIcons focused={focused} icon={tab.icon}/>
                            }}
                        />
                    ))}
            </Tabs></SubscriptionsProvider>
           )
    }
;

export default TabLayout;