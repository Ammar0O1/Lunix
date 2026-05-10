import React, { useMemo } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "react-native-css";
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { formatCurrency } from '@/lib/utils';
import { colors } from '@/constants/theme';
import '@/global.css';

const SafeAreaView = styled(RNSafeAreaView);

const Insights = () => {
  const { subscriptions } = useSubscriptions();

  const { monthly, yearly, activeCount } = useMemo(() => {
    const monthly = subscriptions.reduce((sum, s) => {
      if (s.billing === 'Monthly') return sum + s.price;
      if (s.billing === 'Yearly') return sum + s.price / 12;
      return sum;
    }, 0);
    const yearly = subscriptions.reduce((sum, s) => {
      if (s.billing === 'Monthly') return sum + s.price * 12;
      if (s.billing === 'Yearly') return sum + s.price;
      return sum;
    }, 0);
    return { monthly, yearly, activeCount: subscriptions.length };
  }, [subscriptions]);

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    subscriptions.forEach(s => {
      const cat = s.category ?? 'Other';
      const monthly = s.billing === 'Yearly' ? s.price / 12 : s.price;
      totals[cat] = (totals[cat] ?? 0) + monthly;
    });
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    return entries.map(([cat, amount]) => ({
      cat,
      amount,
      pct: total > 0 ? (amount / total) * 100 : 0,
    }));
  }, [subscriptions]);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-30">
        <Text className="list-title mb-5">Insights</Text>

        <View className="home-balance-card mb-4">
          <Text className="home-balance-label">Monthly</Text>
          <View className="home-balance-row">
            <Text className="home-balance-amount">{formatCurrency(monthly)}</Text>
          </View>
        </View>

        <View className="home-balance-card mb-4">
          <Text className="home-balance-label">Yearly</Text>
          <View className="home-balance-row">
            <Text className="home-balance-amount">{formatCurrency(yearly)}</Text>
          </View>
        </View>

        <Text className="text-sm font-sans-medium text-muted-foreground mt-2 mb-6">
          {activeCount} subscription{activeCount !== 1 ? 's' : ''}
        </Text>

        <Text className="list-title mb-4">By Category</Text>

        {categoryBreakdown.length === 0 ? (
          <Text className="home-empty-state">No subscriptions yet.</Text>
        ) : (
          categoryBreakdown.map(({ cat, amount, pct }) => (
            <View key={cat} className="mb-4">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text className="sub-label">{cat}</Text>
                <Text className="sub-value">{formatCurrency(amount)}/mo</Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: colors.accent, borderRadius: 3 }} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default Insights
