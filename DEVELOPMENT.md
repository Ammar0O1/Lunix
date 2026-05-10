# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR for device)
npm run android    # Launch on Android emulator/device
npm run ios        # Launch on iOS simulator/device
npm run web        # Launch in browser
npm run lint       # Run ESLint via expo lint
```

## Architecture

This is an **Expo Router** app (file-based routing) for subscription management. React Native + NativeWind (Tailwind CSS for RN) + TypeScript.

### Routing Structure

```
app/
  _layout.tsx          # Root layout: loads PlusJakartaSans fonts, hides splash
  onboarding.tsx       # Onboarding screen
  (auth)/              # Auth route group
    _layout.tsx
    Sign-in.tsx
    Sign-up.tsx
  (tabs)/              # Main tab navigator
    _layout.tsx        # Floating pill-style tab bar using constants/theme.ts
    index.tsx          # Home: balance card + upcoming + all subscriptions
    subscriptions.tsx
    insights.tsx
    settings.tsx
  subscriptions/
    [id].tsx           # Subscription detail (dynamic route)
```

### Styling System

Styles use **NativeWind v5** (Tailwind for React Native). All design tokens are defined in two places that must stay in sync:

- `global.css` — CSS custom properties (`@theme`) + component utility classes (`@layer components`)
- `constants/theme.ts` — Same values as JS constants (used in imperative/StyleSheet code)

All semantic class names (e.g. `home-header`, `sub-card`, `auth-button`) are defined in `global.css` under `@layer components`. Prefer these over inline Tailwind classes for consistency.

Font classes follow the pattern `font-sans`, `font-sans-bold`, `font-sans-semibold`, etc. (mapped from PlusJakartaSans).

### Key Conventions

- **Path alias**: `@/` maps to the project root (e.g. `@/components/...`, `@/constants/...`)
- **Global types**: Shared interfaces (`Subscription`, `SubscriptionCardProps`, etc.) live in `type.d.ts` at the root — no imports needed
- **Constants**: Static data, icons, images, and theme values are all in `constants/`
- **Utilities**: `lib/utils.ts` has `formatCurrency`, `formatSubscriptionDateTime`, `formatStatusLabel`
- `react-native-css`'s `styled()` is used to apply NativeWind classes to core RN components (e.g. `styled(SafeAreaView)`)
- The app uses `newArchEnabled: true` and `reactCompiler: true` (Expo experiments)