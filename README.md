# Streamers House '26 — Internal Operations Planning Portal

> A fully functional internal planning dashboard built for **Streamers House '26**, a 3-day creator event in Toronto, Ontario, Canada.

![Streamers House](https://img.shields.io/badge/Status-Live-brightgreen)
![Version](https://img.shields.io/badge/Version-v0.1-gold)
![Tech](https://img.shields.io/badge/Built%20With-HTML%20%7C%20CSS%20%7C%20JavaScript-blue)
![Firebase](https://img.shields.io/badge/Sync-Firebase%20Realtime%20DB-orange)
![Netlify](https://img.shields.io/badge/Hosted-Netlify-teal)

---

## 🔗 Live Site
**[streamershouse26.netlify.app](https://streamershouse26.netlify.app)**

---

## 📋 About the Project

Streamers House '26 is a 3-day collaborative creator event bringing together 8 Canadian content creators in Toronto, Ontario for content creation, live streaming, collaborations, and community building.

This portal is the **internal operations hub** used by organizers, creators, media teams, and planners to coordinate every aspect of the event — before, during, and after.

The design philosophy was **"Apple meets Notion meets Linear"** — clean, premium, and genuinely usable.

---

## ✨ Features

### 📊 Dashboard
- Hero section with hand-crafted Toronto CN Tower SVG skyline (dusk/golden hour)
- Real-time planning progress bar (manually adjustable)
- Live stat cards (Creators, Guests, Sponsors, Event Days)
- Editable recent updates feed

### 👥 People Management
- **Team** — Org chart with roles (Chief Planner, Coordinator, Social Media, Design, Media)
- **Creators** — 8 creator cards with real embedded photos, handles, social links
- **Guest** — Featured Day 2 guest card with photo and editable notes
- **Sponsors** — Add/remove sponsor cards with logo, contribution, notes

### 📅 Planning Tools
- **Timeline** — Pre/During/Post event checklists with checkboxes across 5 phases
- **Announcements** — Add/delete/edit announcement board
- **Streaming Plan** — Editable table (Time, Streamer, Platform, Topic, Notes)
- **Creator Tasks** — Individual checklists per creator, auto-generated from roster

### 🍽️ Logistics
- **Food Plan** — 3-day meal grid (Breakfast, Lunch, Dinner, Snacks) all editable
- **Budget** — Editable table with auto-calculated Estimated/Actual/Variance totals
- **Social Media** — Live clickable links to all official channels

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic structure, all 13 sections |
| **CSS3** | Dark theme, glassmorphism, animations, responsive layout |
| **Vanilla JavaScript** | All interactivity, DOM manipulation, routing |
| **Firebase Realtime Database** | Live sync — all edits reflect instantly for all users |
| **localStorage** | Offline fallback — works without internet connection |
| **Google Fonts** | Space Grotesk + Inter typography |
| **Font Awesome 6** | Icons throughout the UI |
| **Netlify** | Hosting and deployment |

**Zero frameworks. Zero build tools. Zero dependencies beyond CDN links.**

---

## 🏗️ Project Structure

```
streamers-house-26/
├── index.html          # Main HTML — all 13 sections
├── css/
│   └── styles.css      # All styling — dark theme, layout, components
├── js/
│   ├── app.js          # Main app logic — navigation, init, save/load
│   ├── firebase.js     # Firebase config, read/write, real-time sync
│   └── creators.js     # Creator cards, tasks rendering
├── assets/
│   └── (creator photos — embedded as base64 in production)
└── README.md
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#080808` |
| Card | `#141414` |
| Gold Accent | `#D4AF37` |
| White | `#FFFFFF` |
| Muted | `#888888` |
| Success | `#52C07A` |
| Danger | `#E05252` |
| Border Radius | `12px` |
| Font — UI | Space Grotesk |
| Font — Body | Inter |

### Key Design Patterns
- **Glassmorphism cards** with `backdrop-filter: blur()`
- **Gold left-border** active state on sidebar nav
- **Sticky sidebar** with collapsible mobile menu
- **contenteditable** elements with gold focus ring
- **Debounced auto-save** on blur — saves to Firebase + localStorage simultaneously

---

## ⚡ How Editing & Saving Works

```
User edits a field
        ↓
onChange/onBlur fires
        ↓
┌─────────────────────────────────────┐
│  1. Save to localStorage (instant)  │  ← offline backup
│  2. Save to Firebase (async)        │  ← live sync for all users
└─────────────────────────────────────┘
        ↓
Firebase pushes update to all connected browsers in real time
        ↓
All team members see the change without refreshing
```

---

## 🔥 Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Realtime Database** → Start in test mode
3. Set rules to allow read/write:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Copy your `firebaseConfig` into `js/firebase.js`

---

## 🚀 Deployment

Hosted on **Netlify** via manual drag-and-drop deploy.

To redeploy:
1. Go to [netlify.com](https://netlify.com) → your site
2. Drag the updated `index.html` into Production deploys
3. Click "Rename and deploy"

---

## 📱 Responsive Design

| Breakpoint | Layout |
|---|---|
| Desktop (>900px) | Sticky sidebar + scrollable main content |
| Tablet (600–900px) | Collapsible hamburger sidebar |
| Mobile (<600px) | Single column, stacked cards |

---

## 👨‍💻 Built By

**Clinton Coker** — Chief Planner, Streamers House '26

---

## 📸 Creators

| Handle | Role |
|---|---|
| Clinton Coker | Chief Planner & Creator |
| Chile Reptile | Creator |
| Benzchukwu | Creator |
| Eman2freshh | Creator |
| Ekem | Creator |
| Bazz_yuware | Creator |
| jesse.pkr | Creator |
| Mubaraq.3 | House Coordinator & Creator |

**Guest Appearance:** Dreadheadmajik (Day 2)

---

## 📄 License

This project is private — built for internal use by the Streamers House '26 team.

---

*"To help creators grow faster together than they ever could alone while inspiring young people to create instead of consume."*
