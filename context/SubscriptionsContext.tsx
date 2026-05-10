import React, { createContext, useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { HOME_SUBSCRIPTIONS } from '@/constants/data';

interface SubscriptionsContextType {
  subscriptions: Subscription[];
  balance: number;
  addSubscription: (subscription: Subscription) => void;
  removeSubscription: (id: string) => void;
  clearSubscriptions: () => void;
  setBalance: (amount: number) => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextType | null>(null);

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);
  const [balance, setBalance] = useState(2489.48);

  // Auto-remove subscriptions whose renewalDate has passed
  useEffect(() => {
    function purgeExpired() {
      const startOfToday = dayjs().startOf('day');
      setSubscriptions(prev => prev.filter(s => !s.renewalDate || !dayjs(s.renewalDate).startOf('day').isBefore(startOfToday)));
    }
    purgeExpired();
    const id = setInterval(purgeExpired, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function addSubscription(subscription: Subscription) {
    setSubscriptions((prev) => [subscription, ...prev]);
    setBalance((prev) => prev - subscription.price);
  }

  function removeSubscription(id: string) {
    const removed = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    if (removed) setBalance((prev) => prev + removed.price);
  }

  function clearSubscriptions() {
    setSubscriptions([]);
  }

  return (
    <SubscriptionsContext.Provider value={{ subscriptions, balance, addSubscription, removeSubscription, clearSubscriptions, setBalance }}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error('useSubscriptions must be used within SubscriptionsProvider');
  return ctx;
}
