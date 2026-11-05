# Paymentify on GitHub Pages + Firebase (no Node needed)

Layout
- `docs/`  the app (GitHub Pages hosts this folder)
- `docs/firebase-config.js`  paste your Firebase keys here
- `firestore.rules`  database rules (paste into the Firebase console)

## Part 1: Firebase (browser only)
1. https://console.firebase.google.com > **Add project** > name it `paymentify`.
2. **Build > Authentication > Get started > Sign-in method > Google > Enable > Save**.
3. **Build > Firestore Database > Create database** > pick a nearby location (India: `asia-south1`) > **Production mode** > Enable.
4. Firestore > **Rules** tab > replace everything with the contents of `firestore.rules` > **Publish**.
5. Gear icon > **Project settings > Your apps > Web `</>`** > register `Paymentify` (leave "Firebase Hosting" unticked).
6. Copy the config values into `docs/firebase-config.js`, replacing every `PASTE_...`, and save.

## Part 2: GitHub Desktop
1. Unzip, then **File > Add local repository** > choose the `paymentify` folder (or "create a repository" if asked).
2. Summary "First version" > **Commit to main** > **Publish repository**.
   Untick "Keep this code private". Free GitHub Pages needs a public repository. Your Firebase keys are safe to be public: your data is protected by Google sign-in and the Firestore rules.

## Part 3: Turn on GitHub Pages
1. On github.com open your repository > **Settings > Pages**.
2. Source: **Deploy from a branch**. Branch: `main`. Folder: `/docs`. Click **Save**.
3. Wait about a minute. Your app is at `https://YOUR-USERNAME.github.io/paymentify/`.

## Part 4: Allow your GitHub address for Google sign-in
Firebase console > **Authentication > Settings > Authorized domains > Add domain** > `YOUR-USERNAME.github.io` (domain only, no path).

## Part 5: First use
1. Open your link and tap **Sign in with Google**.
2. Moving data from an older link? Settings > **Download backup file** on the old link, then Settings > **Restore** on the new one.
3. Add to Home Screen. Open it online twice so it also works offline.

Every future change: edit, **Commit**, **Push origin**. The site updates in about a minute.

## Troubleshooting
- `auth/unauthorized-domain`: Part 4 was missed.
- "Cloud access denied": Part 1 step 4 rules not published.
- Login does nothing: `docs/firebase-config.js` still has `PASTE_...`.
- 404 page: Pages folder must be `/docs`, and wait a minute after saving.
- Changes not showing: close and reopen the app once.
