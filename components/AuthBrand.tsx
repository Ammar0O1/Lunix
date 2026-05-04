import { View, Text } from 'react-native';
import '@/global.css';

const ACCENT = '#ea7a53';
const PRIMARY = '#081126';

// Recreates the LUNIX bar-chart + trend-arrow logo in theme colors.
// Arrow math (65×52 canvas):
//   Line from (0, 37) → (68, 3)
//   length ≈ 76px  |  angle ≈ -26.6°  |  midpoint (34, 20)
//   → View: left = 34 - 38 = -4,  top = 20 - 1.5 = 18.5

function LunixIcon() {
  return (
    <View style={{ width: 65, height: 52 }}>
      {/* Bar 1 — accent, faded */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0,
        width: 14, height: 19,
        backgroundColor: ACCENT, opacity: 0.55, borderRadius: 3,
      }} />
      {/* Bar 2 — accent */}
      <View style={{
        position: 'absolute', bottom: 0, left: 21,
        width: 14, height: 30,
        backgroundColor: ACCENT, borderRadius: 3,
      }} />
      {/* Bar 3 — primary (tallest) */}
      <View style={{
        position: 'absolute', bottom: 0, left: 42,
        width: 14, height: 42,
        backgroundColor: PRIMARY, borderRadius: 3,
      }} />

      {/* Diagonal trend line */}
      <View style={{
        position: 'absolute',
        left: -4, top: 18.5,
        width: 76, height: 3,
        backgroundColor: PRIMARY,
        borderRadius: 2,
        transform: [{ rotate: '-26.6deg' }],
      }} />

      {/* Arrowhead triangle at the top-right end of the line */}
      <View style={{
        position: 'absolute',
        top: -3, right: -5,
        width: 0, height: 0,
        borderTopWidth: 6, borderTopColor: 'transparent',
        borderBottomWidth: 6, borderBottomColor: 'transparent',
        borderLeftWidth: 10, borderLeftColor: PRIMARY,
        transform: [{ rotate: '-26deg' }],
      }} />
    </View>
  );
}

export default function AuthBrand() {
  return (
    <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
      <LunixIcon />
      <Text className="auth-wordmark" style={{ letterSpacing: 4, marginTop: 12 }}>
        LUNIX
      </Text>
      <Text className="auth-wordmark-sub">Subscription Manager</Text>
    </View>
  );
}
