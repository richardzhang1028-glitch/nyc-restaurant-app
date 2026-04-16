# 🍽️ BITE NYC

A restaurant discovery platform for NYC students — focused on Columbia and NYU. Course term project.

> **Tech stack:** HTML / CSS / JavaScript · Node.js + Express · MongoDB (Mongoose) · Leaflet

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v18+)
- **MongoDB** (running locally)
  - Mac install:
    ```bash
    brew tap mongodb/brew
    brew install mongodb-community@7.0
    brew services start mongodb-community@7.0
    ```
- **Git**

### 2. Clone the repo

```bash
git clone https://github.com/richardzhang1028-glitch/nyc-restaurant-app.git
cd nyc-restaurant-app
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

Create a `.env` file in the project root with:

```
MONGODB_URI=mongodb://localhost:27017/bitenyc
PORT=3000
```

### 5. Seed the database

```bash
node data/seed.js                    # 1067 restaurants + 10 deals
node data/seed_users_checkins.js     # 15 users + 120 check-ins
```

### 6. Start the server

```bash
node server.js
```

Open **http://localhost:3000** in your browser.

---

## 🎯 Demo accounts

| Email | School | Notes |
|-------|--------|-------|
| `emma@columbia.edu` | Columbia | #1 on leaderboard, 12 check-ins, friends with Ryan & Sophia |
| `maya@nyu.edu` | NYU | NYU top user, 11 check-ins |
| Any `@columbia.edu` or `@nyu.edu` email | — | Auto-registers as a new user |

---

## 📁 Project structure

```
nyc-restaurant-app/
├── data/                          # Data files + seed scripts
│   ├── restaurants.json           # 1067 restaurants (Person 3)
│   ├── deals.json                 # 10 deals (Person 3)
│   ├── users.json                 # 15 users (Person 4)
│   ├── checkins.json              # 120 check-ins (Person 4)
│   ├── seed.js                    # Seeds restaurants + deals
│   └── seed_users_checkins.js     # Seeds users + check-ins
├── public/                        # Frontend static files (served by Express)
│   ├── index.html                 # Login + main dashboard
│   ├── leaderboard.html           # Social page (Leaderboard + Friends tabs)
│   └── styles.css                 # Global styles
├── server/                        # Backend code
│   ├── db.js                      # MongoDB connection
│   └── routes/                    # API routes (one file per resource)
│       ├── restaurants.js
│       ├── reviews.js
│       ├── favourites.js
│       ├── deals.js
│       ├── users.js               # Users + friends
│       ├── checkins.js
│       └── leaderboard.js
├── server.js                      # Express entry point
└── package.json
```

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
- `POST /api/checkins` — create `{ user_id, restaurant_place_id, restaurant_name, school }`
- `GET /api/checkins?user_id=&school=` — list check-ins

### Leaderboard
- `GET /api/leaderboard?school=&limit=` — top users by check-in count
- `GET /api/leaderboard/restaurants?school=&limit=` — top restaurants by check-in count

---

## 🗄️ Database schema

```js
// User
{ id, name, email, school, theme, friends: [Number] }

// Checkin
{ user_id, restaurant_place_id, restaurant_name, school, checkin_time }

// Restaurant
{ place_id, name, lat, lng, address, rating, price, cuisine, school, ... }
```

---

## ✨ Core features

- Login / auto-register (school detected from email domain)
- Restaurant search + filtering (by type and price)
- Leaflet map with list-map sync
- Restaurant detail panel with hero images, reviews, and check-in
- Star rating system for user reviews
- User-scoped favourites with multiple lists
- Social page: Leaderboard (students + restaurants) + Friends (add / remove / search)
- School theming (Columbia blue / NYU purple)
- Geolocation for distance calculation

---

## 👥 Team roles

| Role | Responsibilities |
|------|-----------------|
| Person 1 | Frontend UI & Theme |
| Person 2 | Map & Restaurant Interaction |
| Person 3 | Backend & Database |
| Person 4 | Deals / Events / Leaderboard Data |
| Person 5 | Social Features & Testing |

---

## 🧪 Reset database to fresh state

```bash
node data/seed.js                    # restaurants + deals
node data/seed_users_checkins.js     # users + check-ins
```

To also clear favourites and reviews:
```bash
mongosh bitenyc --eval "db.favourites.deleteMany({}); db.reviews.deleteMany({})"
```
