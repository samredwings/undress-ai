- [x] Add Capacitor Android wrapper tooling for `apps/web` (install deps + add scripts)
- [x] Add `apps/web/capacitor.config.*` pointing to Next.js build output
- [x] Add minimal web app manifest/icons (optional for packaging; still useful)
- [x] Generate/fill `apps/web/android/` scaffold (via `npx cap add android`)
- [x] Sync web assets to Android project (`npx cap sync`)
- [x] Build release APK (`npx cap build android` / `gradlew assembleRelease`)
- [x] Verify resulting APK exists under `apps/web/android/app/build/outputs/apk/...`

