# Seam — Telegram Mining Mini App (User Panel + Admin Panel + Firebase Backend)

এই ফাইলটা পুরো project কিভাবে কাজ করে, আর কিভাবে setup করবে তার সম্পূর্ণ বাংলা গাইড।

---

## ১. এই project-এ কি কি আছে

```
index.html          → User panel (Telegram Mini App, mining button)
admin.html           → Admin panel (users দেখা, balance adjust, settings)
api/verify.js         → User app খুললে চলে: user verify করে balance পাঠায়
api/mine.js           → "Tap to mine" বাটনে click করলে চলে
api/admin-login.js    → Admin password check করে login token দেয়
api/admin-users.js    → Admin panel-এর জন্য user list
api/admin-adjust.js   → Admin manually কারো balance বাড়ায়/কমায়
api/admin-settings.js → mine amount আর cooldown সময় ঠিক করার জন্য
lib/verifyInitData.js → Telegram থেকে আসা data আসল কিনা যাচাই করে
lib/firebaseAdmin.js  → Firebase database-এর সাথে connect করে
lib/adminAuth.js       → Admin login session সামলায়
vercel.json            → Security headers (Telegram-কে app iframe-এ দেখাতে দেয়)
.env.example            → কি কি secret key লাগবে তার তালিকা
```

**সবচেয়ে গুরুত্বপূর্ণ পরিবর্তন যেটা আগে ছিল না:**
আগে balance/coin সংখ্যা browser-এর ভিতরে (JS variable বা localStorage-এ) থাকতো — মানে যেকোনো user browser-এর DevTools খুলে নিজের balance ইচ্ছামতো বদলে ফেলতে পারতো। এখন balance **শুধু Firebase database-এ, server-এর মাধ্যমে** update হয়। Browser শুধু "আমি tap করলাম" এটুকু বলতে পারে, কিন্তু কত coin পাবে সেটা সম্পূর্ণ server ঠিক করে।

---

## ২. কিভাবে কাজ করে (সহজ ভাষায়)

1. User Telegram-এ bot-এর মধ্যে app খোলে
2. Telegram নিজে থেকে একটা secret-signed তথ্য (`initData`) পাঠায় — এতে user-এর ID থাকে, আর এটা bot token দিয়ে signed, তাই কেউ fake করতে পারবে না
3. App সেই `initData` নিয়ে আমাদের সার্ভারে (`/api/verify`) পাঠায়
4. সার্ভার bot token দিয়ে যাচাই করে দেখে এই data সত্যিই Telegram থেকে এসেছে কিনা
5. যাচাই সফল হলে, সার্ভার Firebase-এ গিয়ে সেই user-এর balance বের করে পাঠিয়ে দেয়
6. User "Tap to mine" চাপলে, আবার `initData` সহ `/api/mine`-এ request যায়
7. সার্ভার আবার যাচাই করে, cooldown সময় শেষ হয়েছে কিনা check করে, তারপর Firebase-এ balance বাড়ায়

**Admin panel** আলাদা — এটা কোনো Telegram data ব্যবহার করে না, শুধু password দিয়ে login করে।

---

## ৩. Firebase Setup (ধাপে ধাপে)

1. [console.firebase.google.com](https://console.firebase.google.com) এ যাও, Google account দিয়ে login করো
2. **Add project** → নাম দাও (যেমন `seam-mining`) → Continue করে project বানাও
3. বাম পাশে **Build → Firestore Database** এ যাও → **Create database** → Production mode select করো → কাছের location বেছে নাও
4. এবার Service Account বানাতে হবে (এটা দিয়ে backend Firebase-এর সাথে কথা বলবে):
   - Project-এর গিয়ার আইকন (⚙️) → **Project settings**
   - **Service accounts** ট্যাব
   - **Generate new private key** বাটনে click করো → একটা `.json` ফাইল download হবে
   - **এই ফাইলটা কখনো GitHub-এ commit করবে না**

5. এই JSON ফাইলটাকে base64 বানাতে হবে (Vercel-এ env variable হিসেবে বসানোর জন্য):
   - Windows-এ PowerShell খুলে: 
     ```
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("ডাউনলোড-হওয়া-ফাইলের-path.json"))
     ```
   - অথবা Mac/Linux terminal-এ:
     ```
     base64 -i সেই-ফাইলের-path.json
     ```
   - যে লম্বা text আসবে, সেটা copy করে রাখো — এটাই `FIREBASE_SERVICE_ACCOUNT_BASE64`

---

## ৪. Vercel-এ Deploy করা

1. এই zip ফাইলের সব content একটা GitHub repo-তে push করো (repo private রাখতে পারো, সমস্যা নেই)
2. [vercel.com](https://vercel.com) এ গিয়ে **Add New → Project** → তোমার GitHub repo select করো → Import করো
3. Deploy করার আগে **Environment Variables** section-এ গিয়ে এই ৪টা যোগ করো:

   | নাম | মান |
   |---|---|
   | `BOT_TOKEN` | তোমার bot-এর token (BotFather থেকে) |
   | `FIREBASE_SERVICE_ACCOUNT_BASE64` | ধাপ ৩ থেকে পাওয়া base64 text |
   | `ADMIN_PASSWORD` | তুমি নিজে একটা strong password ঠিক করো |
   | `ADMIN_SECRET` | random লম্বা string (যেকোনো password generator দিয়ে ৪০+ character বানাও) |

4. **Deploy** বাটনে click করো
5. Deploy শেষ হলে তুমি একটা URL পাবে, যেমন `https://your-project.vercel.app`

---

## ৫. BotFather-এ URL বসানো

1. Telegram-এ **@BotFather** খোলো
2. `/mybots` → তোমার bot select করো
3. **Bot Settings → Menu Button** (অথবা যেখানে Web App URL set করেছিলে)
4. URL হিসেবে দাও: `https://your-project.vercel.app` (নিজের actual Vercel URL বসাও)

---

## ৬. প্রথম Mining Settings বসানো

App deploy হওয়ার পর Firebase-এ এখনো কোনো settings নেই, তাই default (mine amount ১, cooldown ১ ঘন্টা) ব্যবহার হবে। নিজের মতো বদলাতে:

1. Browser-এ যাও: `https://your-project.vercel.app/admin.html`
2. `ADMIN_PASSWORD` দিয়ে login করো
3. উপরের **Mining Settings** থেকে নিজের মতো amount আর cooldown বসিয়ে **Save** করো

---

## ৭. Admin panel দিয়ে যা করতে পারবে

- সব user-এর তালিকা, balance, total mined দেখা যাবে
- নাম/username/ID দিয়ে search করা যাবে
- যেকোনো user-এর balance manual ভাবে বাড়ানো/কমানো যাবে ("Adjust" বাটন — negative সংখ্যা দিলে কমবে)
- Mining amount ও cooldown সময় বদলানো যাবে

**পরামর্শ:** `admin.html` link কাউকে না দিয়ে নিজে সংরক্ষণ করো। চাইলে পরে আমরা Vercel-এর Deployment Protection বা IP restriction দিয়ে আরও একটা layer security যোগ করতে পারি।

---

## ৮. Security summary — কি কি ঠিক করা হয়েছে

| আগে | এখন |
|---|---|
| Balance browser-এ (client-side) থাকতো | Balance শুধু Firebase database-এ, server-এর মাধ্যমে বদলায় |
| যে কেউ script দিয়ে balance বাড়াতে পারতো | প্রতিটা request-এ Telegram-এর signed data যাচাই হয় |
| Cooldown client-এ check হতো (bypass করা সহজ) | Cooldown server-এ transaction দিয়ে check হয়, race condition-ও আটকানো |
| Secret keys code-এ থাকার ঝুঁকি ছিল | সব secret Vercel Environment Variables-এ, code-এ কোথাও লেখা নেই |
| GitHub public repo | Private করা হয়েছে (client already করেছে) |

---

## ৯. যদি কিছু কাজ না করে

- **Admin login fails** → Vercel-এ `ADMIN_PASSWORD` ঠিকভাবে বসানো হয়েছে কিনা check করো
- **verify.js/mine.js 500 error দেয়** → `FIREBASE_SERVICE_ACCOUNT_BASE64` ঠিকভাবে base64 হয়েছে কিনা, আর Firestore database তৈরি হয়েছে কিনা দেখো (Vercel dashboard → Deployments → Functions → Logs-এ exact error দেখা যাবে)
- **Web Telegram-এ খুলছে না** → `vercel.json` deploy হয়েছে কিনা নিশ্চিত করো (এটা CSP header যোগ করে যা Telegram-কে app iframe-এ embed করতে দেয়)
