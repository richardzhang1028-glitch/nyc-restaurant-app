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
- Restaurant search + filtering
- Leaflet map with list-map sync
- Restaurant detail panel + check-in
- Social page: Leaderboard (students + restaurants) + Friends (add / remove / search)
- School theming (Columbia blue / NYU purple)

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
node data/seed.js
node data/seed_users_checkins.js
```