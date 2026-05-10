import React, { useState, useMemo } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, TextInput, FlatList, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "react-native-css";
import { useSubscriptions } from '@/context/SubscriptionsContext';
import SubscriptionCard from '@/components/SubscriptionCard';
import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import { usePostHog } from 'posthog-react-native';
import { icons } from '@/constants/icons';
import dayjs from 'dayjs';
import clsx from 'clsx';
import '@/global.css';

const SafeAreaView = styled(RNSafeAreaView);

type SortOption = 'none' | 'name' | 'price-high' | 'price-low' | 'renewal';

const SORT_CHIPS: { label: string; value: SortOption }[] = [
  { label: 'Default', value: 'none' },
  { label: 'Name', value: 'name' },
  { label: 'Price ↑', value: 'price-high' },
  { label: 'Price ↓', value: 'price-low' },
  { label: 'Renewal', value: 'renewal'},
];

const Subscriptions = () => {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('none');
  const [showCreate, setShowCreate] = useState(false);
  const { subscriptions, removeSubscription, addSubscription } = useSubscriptions();
  const posthog = usePostHog();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.plan?.toLowerCase().includes(q)
    );
  }, [query, subscriptions]);

  const sorted = useMemo(() => {
    if (sort === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price-high') return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === 'price-low') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'renewal') return [...filtered].sort((a, b) =>
      dayjs(a.renewalDate ?? '9999').diff(dayjs(b.renewalDate ?? '9999'))
    );
    return filtered;
  }, [filtered, sort]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      {/* Header */}
      <View className="home-header mb-5">
        <Text className="list-title">Subscriptions</Text>
        <Pressable onPress={() => setShowCreate(true)} hitSlop={8}>
          <Image source={icons.add} className="home-add-icon" />
        </Pressable>
      </View>

      <TextInput
        className="auth-input mb-3"
        placeholder="Search subscriptions..."
        placeholderTextColor="rgba(8,17,38,0.25)"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {/* Sort chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {SORT_CHIPS.map(chip => (
          <Pressable
            key={chip.value}
            className={clsx('picker-option', sort === chip.value && 'picker-option-active')}
            onPress={() => setSort(chip.value)}
          >
            <Text className={clsx('picker-option-text', sort === chip.value && 'picker-option-text-active')}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedId === item.id}
            onPress={() => {
              const isExpanding = expandedId !== item.id;
              posthog.capture('subscription_card_toggled', {
                subscription_id: item.id,
                action: isExpanding ? 'expanded' : 'collapsed',
                screen: 'subscriptions',
              });
              setExpandedId(isExpanding ? item.id : null);
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
        ItemSeparatorComponent={() => <View className="h-4" />}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-30"
        ListEmptyComponent={
          <Text className="home-empty-state">
            {query ? `No results for "${query}"` : 'No subscriptions yet.'}
          </Text>
        }
      />

      <CreateSubscriptionModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={addSubscription}
      />
    </SafeAreaView>
  );
}

export default Subscriptions
