# 🍽️ BITE NYC

A restaurant discovery platform for NYC university students — focused on Columbia and NYU. Course term project for APAN 5490.

> **Tech stack:** HTML / CSS / JavaScript · Node.js + Express · MongoDB (Mongoose) · Leaflet · Google Places API

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v18+)
- **MongoDB** running locally
  - Mac install:
    ```
    brew tap mongodb/brew
    brew install mongodb-community@7.0
    brew services start mongodb-community@7.0
    ```
- **Git**

### 2. Clone the repo

```
git clone https://github.com/richardzhang1028-glitch/nyc-restaurant-app.git
cd nyc-restaurant-app
```

### 3. Install dependencies

```
npm install
```

### 4. Set up environment variables

Create a `.env` file in the project root with:

```
MONGODB_URI=mongodb://localhost:27017/bitenyc
PORT=3000
GOOGLE_API_KEY=your_google_places_api_key_here
```

The Google API key is only needed if re-fetching restaurant data from scratch via `fetch_restaurants.js`. The seeded `restaurants.json` already includes valid photo URLs.

### 5. Seed the database (in this order)

```
node data/seed.js
node data/seed_users_checkins.js
node data/seed_realistic_checkins.js
node data/seed_reviews.js
node data/seed_replies.js
```

What each does:
- `seed.js` — 1067 restaurants + 10 deals
- `seed_users_checkins.js` — 15 users + 120 base check-ins
- `seed_realistic_checkins.js` — replaces with realistic check-ins (30-80 per user, friend overlap)
- `seed_reviews.js` — generates reviews and check-ins for reviewers
- `seed_replies.js` — generates reply threads on reviews

### 6. Start the server

```
node server.js
```

Open **http://localhost:3000** in your browser.

---

## 🎯 Demo accounts

| Email | School | Notes |
|-------|--------|-------|
| `emma@columbia.edu` | Columbia | Friends with Ryan Park and Sophia Li |
| `maya@nyu.edu` | NYU | NYU demo user |
| Any `@columbia.edu` or `@nyu.edu` email | — | Auto-registers as a new user |

---

## 📁 Project structure

```
nyc-restaurant-app/
├── data/                              # Data files + seed scripts
│   ├── restaurants.json               # 1067 restaurants (from Google Places API)
│   ├── deals.json                     # 10 student deals
│   ├── users.json                     # 15 mock users (Columbia + NYU)
│   ├── checkins.json                  # 120 base check-ins
│   ├── seed.js                        # Seeds restaurants + deals
│   ├── seed_users_checkins.js         # Seeds users + base check-ins
│   ├── seed_realistic_checkins.js     # Replaces with realistic check-ins
│   ├── seed_reviews.js                # Seeds reviews (and check-ins for reviewers)
│   ├── seed_replies.js                # Seeds reply threads on reviews
│   └── fetch_restaurants.js           # Utility to re-pull restaurants from Google Places
├── public/
│   └── index.html                     # Single-page app (HTML + CSS + JS)
├── server/                            # Backend code
│   ├── db.js                          # MongoDB connection
│   └── routes/                        # API routes
│       ├── restaurants.js
│       ├── reviews.js
│       ├── favourites.js
│       ├── deals.js
│       ├── users.js                   # Users + friends
│       ├── checkins.js
│       └── leaderboard.js
├── server.js                          # Express entry point
├── package.json
└── README.md
```

---

## 🏗️ Architecture Notes

### Single-Page App (`public/index.html`)

The frontend is intentionally consolidated into one HTML file containing the markup, CSS, and JavaScript. This keeps the deployment simple (no build step, no bundlers) and makes the app easy to inspect end-to-end. Views switch via CSS class swaps on `<body>` (e.g., `body.view-home`, `body.view-map`, `body.view-social`) rather than route changes, making transitions instant.

### Service Layer

All API interactions are abstracted through a `BiteServices` object that handles:
- API calls with try/catch error handling
- Translation between backend `place_id` (Google Places ID) and frontend numeric IDs
- A 60-second restaurant cache to reduce redundant fetches
- Optimistic UI updates: the local state changes immediately while persistence happens in the background

### State Management

Frontend state is held in module-level variables populated on boot/login:
- `checkedInSet` (Set of restaurant IDs the user has checked in at)
- `favState` (favourites organized by list)
- `authState` (auth session and school theming)

These are populated AFTER `BITE_RESTAURANTS` is loaded so that ID translation works correctly. UI re-renders are triggered after each population to ensure check-in badges and favourites appear immediately.

### Real-Time Leaderboard

The leaderboard is computed live via MongoDB aggregation on every request — no caching:
1. `$match` filters check-ins by school (if scoped)
2. `$group` counts check-ins per user (or per restaurant)
3. `$sort` ranks by count descending
4. `$lookup` joins with the `users` collection for names

This guarantees rankings always reflect the current state of the database.

### School-Aware Theming

Email domain detection (`@columbia.edu` vs `@nyu.edu`) drives a CSS variable swap (`--p`, `--p-tint`, `--p-mid`) that re-themes the entire app instantly — Columbia blue (#1A6BB5) or NYU purple (#8B1DB5).

### Map Strategy

The Leaflet map is persistent across all views but **selectively visible**:
- **Map / Favourites / Detail** — map visible
- **Discover / Social** — map hidden behind a solid cream background to focus attention on content

This gives users location context where it matters without visual noise where it doesn't.

---

## 🔌 API overview

All endpoints are prefixed with `/api` and return JSON.

### Restaurants
- `GET /api/restaurants` — list restaurants. Filters: `?school=`, `?cuisine=`, `?price=`, `?rating=`, `?search=`
- `GET /api/restaurants/:id` — single restaurant

### Users
- `GET /api/users` — list all users
- `POST /api/users/register` — `{ name, email, school }`
- `POST /api/users/login` — `{ email }`
- `GET /api/users/:id/friends` — get user's friends
- `POST /api/users/:id/friends` — add friend `{ friendId }`
- `DELETE /api/users/:id/friends/:friendId` — remove friend

### Check-ins
- `POST /api/checkins` — create `{ user_id, restaurant_place_id, restaurant_name, school }` (rejects duplicates)
- `DELETE /api/checkins` — remove `{ user_id, restaurant_place_id }`
- `GET /api/checkins?user_id=&school=` — list check-ins
- `GET /api/checkins/user/:userId` — all check-ins for a user
- `GET /api/checkins/restaurant/:place_id` — all check-ins at a restaurant (joined with user info)

### Reviews
- `GET /api/reviews/:restaurant_id` — top-level reviews with replies nested
- `POST /api/reviews` — create review `{ restaurant_id, author, rating, comment, school }`
- `POST /api/reviews/:reviewId/reply` — reply to a review `{ author, comment, school }`
- `DELETE /api/reviews/:id` — delete a review (also deletes its replies)

### Favourites
- `GET /api/favourites?user_id=` — get user's favourites
- `POST /api/favourites` — add favourite
- `DELETE /api/favourites/:user_id/:restaurant_id` — remove favourite

### Leaderboard
- `GET /api/leaderboard?school=&limit=` — top users by check-in count
- `GET /api/leaderboard/restaurants?school=&limit=` — top restaurants by check-in count

### Deals
- `GET /api/deals?school=` — list active deals

---

## 🗄️ Database schema

```
// User
{ id, name, email, school, theme, friends: [Number] }

// Checkin
{ user_id, restaurant_place_id, restaurant_name, school, checkin_time }
// Unique compound: (user_id, restaurant_place_id) — one check-in per user per restaurant

// Restaurant
{ place_id, name, lat, lng, address, rating, price, cuisine, photo_url, school, ... }

// Review (replies use the same schema with parent_review_id set)
{ restaurant_id, author, rating, comment, school, parent_review_id, created_at }

// Favourite
{ user_id, restaurant_id, restaurant_name, ... }
```

---

## ✨ Core features

- **Browse-first auth** — explore without signing in; auto-register on `.edu` email login
- **School theming** — Columbia blue or NYU purple, applied dynamically based on email domain
- **Restaurant discovery** — search, multi-select filters (Casual / Study-Friendly / Healthy / Upscale), price filter, Nearby filter using geolocation
- **Interactive map** — Leaflet map with school-aware focus and clickable markers
- **Restaurant detail page** — photos, ratings, reviews with reply threads, recent check-ins, get directions
- **Check-ins** — one-tap toggle to track visits (one per user per restaurant, enforced backend + frontend)
- **Reviews + replies** — 1-5 star ratings, written reviews, threaded replies
- **User-scoped favourites** — saved across sessions, organized by category
- **Social tab** — leaderboard (students + restaurants, including friends-only views), friends list with activity feed
- **Real-time leaderboard** — MongoDB aggregation recomputes rankings on every load
- **Mobile responsive** — works on desktop, tablet, and mobile viewports

---

## 🔄 Iterative Development

This codebase reflects multiple rounds of feedback-driven iteration after the initial demo. Major post-demo improvements include:

- **Multi-select vibe filters** with renamed categories (Casual / Study-Friendly / Healthy / Upscale) replacing the original single-select filter system
- **Mobile-first responsive design** with breakpoints for tablet, phone, and iPhone SE-sized viewports
- **Recent Check-ins** display on each restaurant detail page
- **Reply threads** on reviews for richer social context
- **Clickable leaderboard restaurant rows** that navigate to detail pages
- **Cleaner Discover and Social pages** with adaptive panel system that hides the map when content takes focus
- **Backend duplicate prevention** for check-ins (one per user per restaurant)
- **Friends-scope leaderboard** showing where the user's friends actually eat
- **Realistic seed data** with friend overlap on restaurants and weighted-by-rating popularity

---

## 👥 Team

| Name | Role |
|------|------|
| Suxin Liang | Frontend UI & Theme Design |
| Jim Ye | Map & Restaurant Interaction |
| Richard Zhang | Backend & Database Architecture |
| Yuqi Cheng | Data Engineering & Seed Data |
| Jiayi Hao | Social Features, Integration & Testing |

---

## 🧪 Reset database to fresh state

Run the full seed pipeline:

```
node data/seed.js
node data/seed_users_checkins.js
node data/seed_realistic_checkins.js
node data/seed_reviews.js
node data/seed_replies.js
```

To also clear favourites manually:

```
mongosh bitenyc --eval "db.favourites.deleteMany({})"
```

---

## 📚 Course

APAN 5490 — Columbia University · Spring 2026