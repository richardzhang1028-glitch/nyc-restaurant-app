// ── seed_realistic_checkins.js ─────────────────────────────
// Replaces existing check-ins with a realistic distribution:
//   - Every user gets 30-80 check-ins (so all users appear on leaderboard)
//   - Friends have ~30% restaurant overlap (so friends-restaurant feature works)
//   - Higher-rated restaurants get more visits (realistic popularity)
// Run with:  node data/seed_realistic_checkins.js
// Safe to re-run: clears existing check-ins first.

require('dotenv').config();
const mongoose = require('mongoose');
const users = require('./users.json');

// ── Schemas ─────────────────────────────────────────
const restaurantSchema = new mongoose.Schema({}, { strict: false });
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const checkinSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  restaurant_place_id: { type: String, required: true },
  restaurant_name: String,
  school: String,
  checkin_time: { type: Date, default: Date.now }
});
const Checkin = mongoose.model('Checkin', checkinSchema);

// ── Helpers ─────────────────────────────────────────
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Weighted random pick: higher rating = higher chance of being picked
function weightedPick(restaurants) {
  // Weight by (rating - 2.5), so higher-rated restaurants get more visits
  const weights = restaurants.map(r => Math.max(0.5, (r.rating || 3.5) - 2.5));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < restaurants.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return restaurants[i];
  }
  return restaurants[restaurants.length - 1];
}

// Number of check-ins per user (30-80, biased toward middle)
function pickCheckinCount() {
  // Mean around 50, std dev ~12
  const u = (Math.random() + Math.random() + Math.random()) / 3;  // approximate normal
  const count = Math.round(30 + u * 50);
  return Math.max(30, Math.min(80, count));
}

// ── Seed function ───────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('\n🗑️  Clearing existing check-ins...');
    await Checkin.deleteMany({});
    console.log('   Done!');

    const allRestaurants = await Restaurant.find({});
    console.log(`\n🍽️  Found ${allRestaurants.length} restaurants`);

    // Group restaurants by school
    const byCol = allRestaurants.filter(r => r.school === 'columbia');
    const byNyu = allRestaurants.filter(r => r.school === 'nyu');
    console.log(`   Columbia: ${byCol.length}  |  NYU: ${byNyu.length}`);

    if (!users.length) {
      console.error('   ❌ No users found — run seed_users_checkins.js first');
      process.exit(1);
    }

    // ─── Build "favorite restaurants" pool per friend group ───
    // For realistic friend overlap: friend groups share a small pool of "shared favorites"
    // that they'll all visit, in addition to their own picks.
    const userMap = new Map(users.map(u => [u.id, u]));
    const friendGroupFavorites = new Map();  // userId -> array of restaurants the group commonly visits

    // For each user, pre-pick a small set of "favorite" restaurants (8-12)
    // These will be shared with friends to create overlap
    for (const user of users) {
      const pool = user.school === 'columbia' ? byCol : byNyu;
      // Pick 8-12 favorite spots, weighted toward popular ones
      const favorites = [];
      const favCount = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < favCount; i++) {
        favorites.push(weightedPick(pool));
      }
      friendGroupFavorites.set(user.id, favorites);
    }

    // ─── Generate check-ins for each user ───
    console.log('\n📍 Generating check-ins...');
    const newCheckins = [];

    for (const user of users) {
      const pool = user.school === 'columbia' ? byCol : byNyu;
      const myFavorites = friendGroupFavorites.get(user.id) || [];

      // Build "shared with friends" pool: take some restaurants from each friend
      const sharedPool = [];
      for (const friendId of (user.friends || [])) {
        const friendFavs = friendGroupFavorites.get(friendId) || [];
        // Take 30% of friend's favorites to share
        const shareCount = Math.ceil(friendFavs.length * 0.3);
        for (let i = 0; i < shareCount; i++) {
          sharedPool.push(randomItem(friendFavs));
        }
      }

      const targetCount = pickCheckinCount();
      for (let i = 0; i < targetCount; i++) {
        const roll = Math.random();
        let restaurant;
        if (roll < 0.40) {
          // 40% from personal favorites
          restaurant = randomItem(myFavorites);
        } else if (roll < 0.60 && sharedPool.length) {
          // 20% from friends' favorites (creates overlap)
          restaurant = randomItem(sharedPool);
        } else {
          // 40% random discovery (weighted by rating)
          restaurant = weightedPick(pool);
        }

        // Random timestamp within the last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        const checkinTime = new Date(
          Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 - minutesAgo * 60000
        );

        newCheckins.push({
          user_id: user.id,
          restaurant_place_id: restaurant.place_id,
          restaurant_name: restaurant.name,
          school: user.school,
          checkin_time: checkinTime
        });
      }
    }

    // Dedupe: one check-in per (user, restaurant) — keep the most recent
    const seen = new Map();
    for (const c of newCheckins) {
      const key = `${c.user_id}|${c.restaurant_place_id}`;
      const existing = seen.get(key);
      if (!existing || c.checkin_time > existing.checkin_time) {
        seen.set(key, c);
      }
    }
    const dedupedCheckins = Array.from(seen.values());

    console.log(`   ✅ Inserting ${dedupedCheckins.length} check-ins (deduped from ${newCheckins.length})...`);
    await Checkin.insertMany(dedupedCheckins);

    // ─── Stats ───
    console.log('\n📊 Summary:');
    console.log(`   Total check-ins: ${newCheckins.length}`);
    console.log(`   Average per user: ${(newCheckins.length / users.length).toFixed(1)}`);

    // Per-user breakdown
    const userCounts = {};
    for (const c of newCheckins) {
      userCounts[c.user_id] = (userCounts[c.user_id] || 0) + 1;
    }
    console.log('\n   Per-user check-ins:');
    for (const u of users) {
      const count = userCounts[u.id] || 0;
      console.log(`     ${u.name.padEnd(15)} (${u.school}) — ${count} check-ins`);
    }

    // Top restaurants
    const restCounts = {};
    for (const c of newCheckins) {
      const key = c.restaurant_place_id;
      if (!restCounts[key]) restCounts[key] = { name: c.restaurant_name, count: 0 };
      restCounts[key].count++;
    }
    const topRests = Object.values(restCounts).sort((a, b) => b.count - a.count).slice(0, 10);
    console.log('\n   Top 10 restaurants:');
    topRests.forEach((r, i) => console.log(`     ${i + 1}. ${r.name} — ${r.count} visits`));

    // Coverage
    const distinctRestaurants = Object.keys(restCounts).length;
    const coverage = (distinctRestaurants / allRestaurants.length * 100).toFixed(1);
    console.log(`\n   Restaurants with check-ins: ${distinctRestaurants}/${allRestaurants.length} (${coverage}%)`);

    console.log('\n🎉 Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();