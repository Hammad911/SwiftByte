# SwiftBite — Firebase & Mixpanel setup

Firebase **Analytics** and **Mixpanel** receive the same named events from `js/analytics.js`. KPI cards on **`analytics-dashboard.html`** read aggregates from Firestore (`metrics/summary`) because Firebase Analytics totals are only visible in Firebase Console / BigQuery, not in-browser.

---

## Step 1 — Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Create a project** (enable Google Analytics when asked).
2. **Build** → register a **Web** app (`</>`). Copy the `firebaseConfig` object.
3. Paste values into **`js/firebase-config.js`** (same shape as generated SDK snippet).

---

## Step 2 — Products to enable

1. **Authentication** → Sign-in method → enable **Anonymous**.
2. **Firestore Database** → Create database → start in **Production** mode, then paste rules from **`firestore.rules`** (or use Rules tab):
   - `metrics` documents: **public read**, **write only if authenticated**.
3. Deploy rules (Console Rules editor → **Publish**), or CLI:  
   `firebase deploy --only firestore:rules`

---

## Step 3 — Mixpanel (optional)

1. [mixpanel.com](https://mixpanel.com) → create a project → **Project Settings** → copy **Project Token**.
2. Set `window.SWIFTBITE_MIXPANEL_TOKEN` in **`js/firebase-config.js`**.

---

## Step 4 — Run the app correctly

Firebase Analytics works best over **HTTPS** or **`http://localhost`**. Prefer:

```bash
cd Project
python3 -m http.server 8080
```

Open `http://localhost:8080/index.html`.

---

## Step 5 — View results

| Where | What you see |
|--------|----------------|
| **Firebase Console** → Analytics | Streams, conversions, demographics (delayed up to ~24h for some reports). Use **Realtime** for quick checks. |
| **`analytics-dashboard.html`** | KPI counters synced from Firestore increments. |

---

## Events tracked (Firebase + Mixpanel)

| Event | When |
|--------|------|
| `swiftbite_screen_view` | Page load (`screen_name`) |
| `login_success` | Successful login redirect |
| `order_now_click` | Banner Order now |
| `nav_restaurants_tab` | Bottom nav Restaurants |
| `dashboard_open_restaurant` | Card / popular item → restaurant |
| `menu_item_open` | Menu row opens food item |
| `menu_quick_add` | Quick + Add on restaurant |
| `add_to_cart` | Food detail Add to Cart |
| `favorite_toggle` | Heart on restaurant |
| `back_navigation` | Global back button |
| `forgot_password_click` | Forgot password |
| `signup_prompt_click` | Sign up link |
| `social_login_click` | Facebook/Google row |

Firestore fields used in KPIs mirror these (e.g. `login_success`, `screen_dashboard`, `add_to_cart`).
