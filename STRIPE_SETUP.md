# Stripe Card Payments Setup

Paid events can be paid by **card** via Stripe. Cash and points continue to work without Stripe.

## Backend

1. **Install dependency** (if not already):
   ```bash
   cd backend && npm install
   ```

2. **Environment variable** in `backend/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
   ```
   Get this from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (use **Test** keys for development).

3. **Restart the backend** after setting the key. If `STRIPE_SECRET_KEY` is missing, card payment will return 503 and users can still use Cash or Points.

## Frontend (App)

1. **Install dependency** (if not already):
   ```bash
   npm install
   ```

2. **Environment variable** for the app (e.g. `.env` in the project root or EAS env):
   ```env
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
   ```
   Get this from the same Stripe Dashboard (Publishable key). Restart the dev server after changing.

3. **Native build**: `@stripe/stripe-react-native` uses native modules. Use a **development build** (e.g. `eas build` or `expo run:ios` / `expo run:android`). Payment Sheet will not work in Expo Go.

### Android: Kotlin 2 and JVM target

The Stripe Android SDK needs **Kotlin 2.x**. The project is set up with:

- `expo-build-properties` and `kotlinVersion: "2.0.21"` in `app.json`
- Root `android/build.gradle` sets `ext.kotlinVersion` and forces Kotlin JVM target `17` for all modules
- `android/gradle.properties` has `StripeSdk_kotlinVersion=2.0.21`

If the build fails on `:stripe_stripe-react-native:compileDebugKotlin`:

1. Clean and rebuild:
   ```bash
   cd android && gradlew.bat clean && cd ..
   expo run:android
   ```
2. Use the Expo-recommended Stripe version:
   ```bash
   npx expo install @stripe/stripe-react-native
   ```
   Then run `expo run:android` again.
3. To see the **exact** Kotlin error, run:
   ```bash
   cd android
   gradlew.bat :stripe_stripe-react-native:compileDebugKotlin --stacktrace
   ```
   The last few lines before "Compilation error" usually show the real cause. You can also open `android/build/reports/problems/problems-report.html` after a failed build.

### Android on Windows: path longer than 260 characters

If the build fails with **"Filename longer than 260 characters"** (e.g. in `react_codegen_safeareacontext` or other native modules), Windows’ default path limit is the cause.

**Option A – Enable long paths (recommended)**

1. Open **PowerShell as Administrator** and run:
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
2. Restart the computer (or at least close all terminals and Android Studio).
3. If the project is in a Git repo, enable long paths for Git:
   ```bash
   git config --global core.longpaths true
   ```
4. Clean and rebuild:
   ```bash
   cd android
   gradlew.bat clean
   cd ..
   expo run:android
   ```

**Option B – Use a shorter project path**

Move or clone the project to a short path, e.g. `C:\sv` or `C:\dev\SocialVelvet`, then run `npm install` and `expo run:android` from there. Shorter base path keeps generated paths under 260 characters.

**Option C – Virtual drive (no move)**

From PowerShell (no admin needed):

```powershell
subst S: "C:\Users\MohamadTosha\Documents\GitHub\Social-Velvet\SocialVelvet"
```

Then in a new terminal: `S:` → `npm install` → `expo run:android`. The build will see `S:\...` instead of the long path. (Run `subst S: /d` when you want to remove the drive.)

**Note:** On some setups, building from a subst drive can make Gradle fail at `settings.gradle` with *"Process 'command cmd' finished with non-zero exit value 1"* because paths get mixed (S:\ vs real path). If that happens, use **Option A** (enable long paths) or **Option B** (shorter real path) instead.

## Flow

- User taps **Join** on a paid event → chooses **Card** → taps **Pay**.
- App calls `POST /events/:id/create-payment-intent` (optional `pointsAmount` for partial points).
- Backend creates a Stripe Payment Intent and returns `clientSecret` and `paymentIntentId`.
- App opens Stripe **Payment Sheet**; user enters card and confirms.
- App calls `POST /events/:id/join` with `paymentMethod: 'credit_card'` and `paymentIntentId` (and optional `pointsAmount`).
- Backend verifies the Payment Intent with Stripe and creates the attendee/ticket.

## Testing

Use Stripe [test cards](https://docs.stripe.com/testing#cards), e.g. `4242 4242 4242 4242`. Any future expiry and CVC work.
