import "@/global.css"
import {Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View} from "react-native";
import { BlurView } from "expo-blur";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "react-native-css";
import images from "@/constants/images";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useMemo, useState} from "react";
import {useUser} from "@clerk/expo";
import {usePostHog} from "posthog-react-native";
const SafeAreaView = styled(RNSafeAreaView);
export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [draftBalance, setDraftBalance] = useState('');
    const { subscriptions, balance, addSubscription, removeSubscription, setBalance } = useSubscriptions();

    function openBalanceEdit() {
        setDraftBalance(balance.toFixed(2));
        setShowBalanceModal(true);
    }

    function confirmBalance() {
        const parsed = parseFloat(draftBalance);
        if (!isNaN(parsed) && parsed >= 0) setBalance(parsed);
        setShowBalanceModal(false);
    }
    const { user } = useUser();
    const posthog = usePostHog();
    const displayName = user?.username ?? user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? '';

    const upcoming = useMemo(() => {
        const today = dayjs();
        return subscriptions
            .filter(s => s.renewalDate && dayjs(s.renewalDate).diff(today, 'day') >= 0)
            .sort((a, b) => dayjs(a.renewalDate).diff(dayjs(b.renewalDate)))
            .slice(0, 5)
            .map(s => ({
                id: s.id,
                icon: s.icon,
                name: s.name,
                price: s.price,
                currency: s.currency,
                daysLeft: dayjs(s.renewalDate).diff(today, 'day'),
            }));
    }, [subscriptions]);

    return (
        <SafeAreaView className={"flex-1  bg-background p-5"}>
            <FlatList
                ListHeaderComponent={() => (
                    <>
                        <View className="home-header">
                            <View className="home-user">
                                <Image source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar} className="home-avatar"  />
                                <Text className="home-user-name">{displayName}</Text>
                            </View>

                            <Pressable onPress={() => setShowCreate(true)} hitSlop={8}>
                                <Image source={icons.add} className="home-add-icon" />
                            </Pressable>
                        </View>

                        <Pressable className="home-balance-card" onPress={openBalanceEdit}>
                            <Text className="home-balance-label">Balance</Text>
                            <View className="home-balance-row">
                                <Text className="home-balance-amount">{formatCurrency(balance)}</Text>
                            </View>
                        </Pressable>
                        <View className="mb-5">
                            <ListHeading title={"Upcoming"} />
                            <FlatList
                                data={upcoming}
                                renderItem={({item}) => (
                                    <UpcomingSubscriptionCard { ...item} />)}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                ListEmptyComponent={<Text className="home-empty-state">No upcoming renewals yet.</Text>}
                            />
                        </View>
                        <ListHeading title={" All Subscriptions"} />

                    </>
                )}
                data={subscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => {
                            const isExpanding = expandedSubscriptionId !== item.id;
                            posthog.capture('subscription_card_toggled', {
                                subscription_id: item.id,
                                action: isExpanding ? 'expanded' : 'collapsed',
                            });
                            setExpandedSubscriptionId(isExpanding ? item.id : null);
                        }}
                        onCancelPress={() => Alert.alert(
                            'Remove Subscription',
                            `Remove ${item.name}? Its cost will be refunded to your balance.`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Remove', style: 'destructive', onPress: () => removeSubscription(item.id) },
                            ]
                        )}
                    />
                )}
                extraData={expandedSubscriptionId}
                ItemSeparatorComponent={()=> <View style={{ height: 16 }} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
                contentContainerClassName={"pb-30"}
            />

            <CreateSubscriptionModal
                visible={showCreate}
                onClose={() => setShowCreate(false)}
                onSubmit={addSubscription}
                balance={balance}
            />

            <Modal
                visible={showBalanceModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBalanceModal(false)}
            >
                {/* BlurView is absolutely positioned so it always covers the full screen, even behind the keyboard */}
                <BlurView intensity={60} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                <Pressable
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    onPress={() => setShowBalanceModal(false)}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                    <Pressable
                        style={{ backgroundColor: '#fff9e3', borderRadius: 24, padding: 28, width: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 }}
                        onPress={() => {}}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(8,17,38,0.45)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Set Balance</Text>
                        <TextInput
                            value={draftBalance}
                            onChangeText={setDraftBalance}
                            keyboardType="decimal-pad"
                            autoFocus
                            style={{ fontSize: 36, fontWeight: '800', color: '#081126', borderBottomWidth: 2, borderColor: '#ea7a53', paddingBottom: 10, marginBottom: 28 }}
                            onSubmitEditing={confirmBalance}
                            returnKeyType="done"
                            selectTextOnFocus
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <BlurView intensity={20} tint="light" style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                                <Pressable
                                    onPress={() => setShowBalanceModal(false)}
                                    style={{ padding: 15, alignItems: 'center', backgroundColor: 'rgba(8,17,38,0.06)', borderWidth: 0.5, borderColor: 'rgba(8,17,38,0.1)' }}
                                >
                                    <Text style={{ color: '#081126', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                                </Pressable>
                            </BlurView>
                            <BlurView intensity={30} tint="default" style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }}>
                                <Pressable
                                    onPress={confirmBalance}
                                    style={{ padding: 15, alignItems: 'center', backgroundColor: 'rgba(234,122,83,0.88)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' }}
                                >
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Save</Text>
                                </Pressable>
                            </BlurView>
                        </View>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
