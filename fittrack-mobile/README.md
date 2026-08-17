# FitTrack Mobile 📱

The native Android/iOS companion app for [FitTrack](../README.md) — built with **Expo SDK 57**, **React Native 0.86**, **TypeScript**, and **Expo Router**. It shares the existing FitTrack backend and account system: log a meal on your phone and it appears on the web app instantly (and vice versa).

## Features

Everything from the FitTrack web app, optimized for mobile:

- **Authentication** — login & full signup (body metrics, goals, daily targets), session persisted securely with `expo-secure-store`
- **Dashboard** — daily calorie / protein / water progress cards, quick actions, today's meal list with swipe-free delete, body stats (weight, target, BMI)
- **Food logging** — built-in food database + your custom foods, serving-size presets or custom grams, live nutrition preview
- **Custom foods** — create foods with full macro validation (same rules as the backend)
- **Water tracking** — quick-add chips, ±250ml steppers, custom amounts, live progress
- **History** — recent-days strip with goal badges, per-day detail, food search, delete (today), native date picker
- **Analytics** — 7/14/30-day averages, goal achievement, best days, tracking streaks, trend charts with goal lines
- **Profile** — view & edit all metrics, targets and goals

Plus two mobile-only features powered by **local scheduled notifications** (no backend involvement):

- **Protein reminders** 💪 — multiple daily reminders ("Remind me to add my protein at 10:00 AM every day"), each with its own time, custom message and on/off toggle. Tapping the notification opens the food-logging screen.
- **Water reminders** 💧 — configurable interval (1h / 2h / 3h / 4h / custom minutes) within a start–end window ("every 2 hours between 8:00 AM and 10:00 PM"), custom message, live schedule preview. Tapping the notification opens the water tracker.

Both are managed from the dedicated **Reminders & Notifications** screen (bell icon on the dashboard, or Profile → Settings), which also handles notification permissions, including deep-linking to system settings when permission was denied.

## Architecture

```
fittrack-mobile/
├── app.json                  # Expo config (icons, splash, notification plugin)
├── scripts/generate-assets.js# Regenerates all icons/splash from code
└── src/
    ├── app/                  # Expo Router routes
    │   ├── _layout.tsx       # Providers, splash, notification deep-link observer
    │   ├── (auth)/           # login, signup (redirects when authenticated)
    │   └── (app)/            # guarded app area
    │       ├── (tabs)/       # Dashboard · History · Analytics · Profile
    │       ├── log-food.tsx  #   modals
    │       ├── log-water.tsx
    │       ├── create-food.tsx
    │       ├── edit-profile.tsx
    │       └── reminders/    # settings hub + protein & water editors
    ├── api/                  # axios client + typed endpoint wrappers
    ├── components/           # Card, GradientButton, ProgressCard, BarChart, …
    ├── constants/theme.ts    # FitTrack design tokens (ported from Tailwind)
    ├── context/              # Auth, Reminders, Toast providers
    ├── data/foodDatabase.ts  # built-in foods (mirrors the web app)
    ├── notifications/        # permission handling + reminder scheduler
    ├── types/                # backend API + reminder types
    └── utils/                # UTC date helpers, formatting
```

Key decisions:

- **Zero backend changes.** The app consumes the existing `fittrack-backend` API exactly as the web app does — same endpoints, same payloads, same UTC-midnight day convention. The web frontend is untouched.
- **Reminders are fully local.** Schedules persist in AsyncStorage; each reminder becomes a repeating `DAILY` notification trigger (a water schedule expands into one trigger per time slot). They are re-synced on every app launch, capped well below iOS's 64-notification limit.
- **Light theme only**, matching the web app's design language (blue→indigo→purple background, white cards, orange/red calories, red/pink protein, blue/cyan water).

## Running locally

### 1. Start the backend

```bash
cd fittrack-backend
npm install
npm run dev        # starts on http://localhost:6001 (needs MongoDB, see backend README)
```

### 2. Start the mobile app

```bash
cd fittrack-mobile
npm install
npm start          # starts the Expo dev server
```

Then:

- **Android emulator**: press `a`
- **iOS simulator** (macOS): press `i`
- **Physical device**: install [Expo Go](https://expo.dev/go) and scan the QR code (device must be on the same Wi-Fi as your computer)

**API URL**: no configuration needed in development — the app automatically targets the machine running the Expo dev server on port `6001`, which works for emulators *and* physical devices on your network. To point elsewhere, copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`.

> **Note on notifications in Expo Go**: local scheduled reminders work in Expo Go, but for the full production notification experience (custom icon/channels) use a development build: `npx expo run:android` / `npx expo run:ios`, or an EAS development build.

### Useful scripts

```bash
npm run typecheck        # TypeScript
npm run lint             # ESLint
npm run generate-assets  # regenerate icons/splash from scripts/generate-assets.js
```

## Production builds (EAS)

[EAS Build](https://docs.expo.dev/build/introduction/) is the recommended way to produce store-ready binaries.

```bash
npm install -g eas-cli
eas login
eas build:configure          # creates eas.json + links the project
```

Set the production API URL so builds don't point at localhost — either in `eas.json`:

```jsonc
{
  "build": {
    "production": {
      "env": { "EXPO_PUBLIC_API_URL": "https://your-fittrack-backend.example.com" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://your-fittrack-backend.example.com" }
    }
  }
}
```

…or as an [EAS environment variable](https://docs.expo.dev/eas/environment-variables/).

Then build:

```bash
# Android
eas build --platform android --profile production   # AAB for Play Store
eas build --platform android --profile preview      # APK for direct install/testing

# iOS (requires an Apple Developer account)
eas build --platform ios --profile production
```

Submit to the stores with `eas submit --platform android` / `--platform ios`.

**Local native builds** (without EAS) also work if you have the native toolchains installed:

```bash
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

## Notes & limitations

- Android may deliver scheduled reminders a few minutes late due to battery optimization (exact-alarm permission is deliberately not requested).
- The backend only allows modifying **today's** entry (adding/removing food, water) — past days are read-only, same as the web app.
- Reminder settings live on the device (by design — they're device notifications), so they don't roam between phones.
