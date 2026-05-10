import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { icons } from '@/constants/icons';
import { usePostHog } from 'posthog-react-native';
import '@/global.css';

const CATEGORIES = [
  'Entertainment',
  'AI Tools',
  'Developer Tools',
  'Design',
  'Productivity',
  'Cloud',
  'Music',
  'Other',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: '#b8e8d0',
  'AI Tools': '#b8d4e3',
  'Developer Tools': '#e8def8',
  Design: '#f5c542',
  Productivity: '#ffd4b8',
  Cloud: '#d4e8f5',
  Music: '#f5d4e8',
  Other: '#e8e8d4',
};

type Frequency = 'Monthly' | 'Yearly' | 'Custom';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
  balance: number;
}

export default function CreateSubscriptionModal({ visible, onClose, onSubmit, balance }: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [category, setCategory] = useState('');
  const [customMonth, setCustomMonth] = useState('');
  const [customDay, setCustomDay] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const posthog = usePostHog();

  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  const parsedPrice = parseFloat(price);

  function getCustomDate() {
    const m = parseInt(customMonth);
    const d = parseInt(customDay);
    const y = parseInt(customYear);
    if (!m || !d || !y || customYear.length !== 4) return null;
    const date = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    if (!date.isValid()) return null;
    // Reject dates Day.js silently corrected (e.g. Feb 31 → Mar 3)
    if (date.month() + 1 !== m || date.date() !== d || date.year() !== y) return null;
    return date;
  }

  const customDateValid =
    frequency !== 'Custom' ||
    (() => {
      const date = getCustomDate();
      return date !== null && date.isAfter(dayjs(), 'day');
    })();

  const canSubmit =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    !isNaN(parsedPrice) &&
    parsedPrice > 0 &&
    customDateValid;

  function clearError(field: string) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function resetForm() {
    setName('');
    setPrice('');
    setFrequency('Monthly');
    setCategory('');
    setCustomMonth('');
    setCustomDay('');
    setCustomYear('');
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!price.trim()) {
      e.price = 'Price is required.';
    } else if (isNaN(parsedPrice) || parsedPrice <= 0) {
      e.price = 'Enter a valid positive price.';
    }
    if (frequency === 'Custom') {
      const date = getCustomDate();
      if (!date) {
        e.customDate = 'Enter a valid date (MM / DD / YYYY).';
      } else if (!date.isAfter(dayjs(), 'day')) {
        e.customDate = 'Expiry date must be in the future.';
      }
    }
    if (parsedPrice > balance) e.price = 'Insufficient balance.';
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const resolvedCategory = category || 'Other';
    const startDate = dayjs().toISOString();
    let renewalDate: string;
    if (frequency === 'Monthly') {
      renewalDate = dayjs().add(1, 'month').toISOString();
    } else if (frequency === 'Yearly') {
      renewalDate = dayjs().add(1, 'year').toISOString();
    } else {
      renewalDate = getCustomDate()!.toISOString();
    }

    const subscription: Subscription = {
      id: `${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: name.trim(),
      price: parsedPrice,
      currency: 'USD',
      billing: frequency,
      category: resolvedCategory,
      startDate,
      renewalDate,
      icon: icons.wallet,
      color: CATEGORY_COLORS[resolvedCategory] ?? CATEGORY_COLORS.Other,
    };

    posthog.capture('subscription_created', {
      category: resolvedCategory,
      billing: frequency,
    });

    onSubmit(subscription);
    resetForm();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <BlurView intensity={50} tint="dark" style={{ flex: 1 }}>
          <Pressable style={{ flex: 1 }} onPress={handleClose}>
            <Pressable className="modal-container" onPress={() => {}}>

              {/* Drag handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 2 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(8,17,38,0.15)' }} />
              </View>

            {/* Header */}
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable className="modal-close" onPress={handleClose}>
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView
              contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className={clsx('auth-input', errors.name && 'auth-input-error')}
                  placeholder="e.g. Netflix"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={name}
                  onChangeText={(v) => { setName(v); clearError('name'); }}
                  returnKeyType="next"
                />
                {errors.name && <Text className="auth-error">{errors.name}</Text>}
              </View>

              {/* Price */}
              <View className="auth-field">
                <Text className="auth-label">Price (USD)</Text>
                <TextInput
                  className={clsx('auth-input', errors.price && 'auth-input-error')}
                  placeholder="0.00"
                  placeholderTextColor="rgba(8,17,38,0.25)"
                  value={price}
                  onChangeText={(v) => { setPrice(v); clearError('price'); }}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                {errors.price && <Text className="auth-error">{errors.price}</Text>}
              </View>

              {/* Billing frequency */}
              <View className="auth-field">
                <Text className="auth-label">Billing</Text>
                <View className="picker-row">
                  {(['Monthly', 'Yearly', 'Custom'] as Frequency[]).map((opt) => (
                    <Pressable
                      key={opt}
                      className={clsx('picker-option', frequency === opt && 'picker-option-active')}
                      onPress={() => { setFrequency(opt); clearError('customDate'); }}
                    >
                      <Text className={clsx('picker-option-text', frequency === opt && 'picker-option-text-active')}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Custom date inputs */}
                {frequency === 'Custom' && (
                  <View style={{ marginTop: 12, gap: 6 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(8,17,38,0.5)', marginBottom: 2 }}>
                      Expiry date
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        className={clsx('auth-input', errors.customDate && 'auth-input-error')}
                        style={{ flex: 1, textAlign: 'center' }}
                        placeholder="MM"
                        placeholderTextColor="rgba(8,17,38,0.25)"
                        value={customMonth}
                        onChangeText={(v) => {
                          const clean = v.replace(/\D/g, '').slice(0, 2);
                          setCustomMonth(clean);
                          clearError('customDate');
                          if (clean.length === 2) dayRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        returnKeyType="next"
                      />
                      <TextInput
                        ref={dayRef}
                        className={clsx('auth-input', errors.customDate && 'auth-input-error')}
                        style={{ flex: 1, textAlign: 'center' }}
                        placeholder="DD"
                        placeholderTextColor="rgba(8,17,38,0.25)"
                        value={customDay}
                        onChangeText={(v) => {
                          const clean = v.replace(/\D/g, '').slice(0, 2);
                          setCustomDay(clean);
                          clearError('customDate');
                          if (clean.length === 2) yearRef.current?.focus();
                        }}
                        keyboardType="number-pad"
                        maxLength={2}
                        returnKeyType="next"
                      />
                      <TextInput
                        ref={yearRef}
                        className={clsx('auth-input', errors.customDate && 'auth-input-error')}
                        style={{ flex: 2, textAlign: 'center' }}
                        placeholder="YYYY"
                        placeholderTextColor="rgba(8,17,38,0.25)"
                        value={customYear}
                        onChangeText={(v) => {
                          const clean = v.replace(/\D/g, '').slice(0, 4);
                          setCustomYear(clean);
                          clearError('customDate');
                        }}
                        keyboardType="number-pad"
                        maxLength={4}
                        returnKeyType="done"
                      />
                    </View>
                    {errors.customDate && <Text className="auth-error">{errors.customDate}</Text>}
                  </View>
                )}
              </View>

              {/* Category */}
              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      className={clsx('category-chip', category === cat && 'category-chip-active')}
                      onPress={() => setCategory((prev) => (prev === cat ? '' : cat))}
                    >
                      <Text className={clsx('category-chip-text', category === cat && 'category-chip-text-active')}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Submit */}
              <BlurView intensity={30} tint="default" style={{ borderRadius: 16, overflow: 'hidden', marginTop: 4 }}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  style={{ padding: 16, alignItems: 'center', backgroundColor: !canSubmit ? 'rgba(234,122,83,0.4)' : 'rgba(234,122,83,0.88)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#081126' }}>Add Subscription</Text>
                </Pressable>
              </BlurView>
            </ScrollView>

            </Pressable>
          </Pressable>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
