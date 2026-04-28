// ── seed_reviews.js ─────────────────────────────────────
// Generates ~250 realistic mock reviews across all restaurants.
// Run with:  node data/seed_reviews.js
// Safe to re-run: it clears existing reviews first.

require('dotenv').config();
const mongoose = require('mongoose');
const users = require('./users.json');

// ── Schemas ─────────────────────────────────────────────
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

const reviewSchema = new mongoose.Schema({
  restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  author: { type: String, default: 'Anonymous' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  school: { type: String },
  created_at: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// ── Review templates by rating ──────────────────────────
const REVIEWS = {
  5: [
    "Genuinely my favorite spot near campus. Highly recommend.",
    "Came here with friends and we all loved it. Coming back soon.",
    "Worth every penny. The food is consistently great.",
    "Best meal I've had in a while. Will definitely be back.",
    "Amazing vibes, amazing food. 10/10.",
    "If you haven't tried this place yet, what are you waiting for?",
    "Hands down one of the best restaurants in the area.",
    "Quality is unreal. The staff was super friendly too.",
    "Honestly perfect for a treat-yourself meal.",
    "Big portions, great taste, fair prices. What more could you want?"
  ],
  4: [
    "Really solid spot. A few minor things but overall great.",
    "Good food, nice atmosphere. Would come back.",
    "Reliable choice for a casual meal with friends.",
    "Pretty good — not life-changing but definitely worth a visit.",
    "Service was a little slow but the food made up for it.",
    "Good for a study session, decent menu.",
    "Tasty and reasonably priced. Solid weekday lunch option.",
    "Came here for dinner and enjoyed it. Will probably return.",
    "Nice find — happy I gave it a try.",
    "Good portions for the price. Recommended."
  ],
  3: [
    "It's fine. Nothing special but nothing bad either.",
    "Decent if you're nearby and need a quick bite.",
    "Average experience. Food was okay, service was okay.",
    "Mid. Wouldn't go out of my way but it works in a pinch.",
    "Hit or miss depending on what you order.",
    "Not bad, not amazing. Standard.",
    "Wasn't really impressed but it wasn't terrible.",
    "Okay for a quick meal between classes.",
    "Pretty mid honestly. Better options around.",
    "Food was fine but a little overpriced for what you get."
  ],
  2: [
    "Disappointed. Wouldn't come back.",
    "Service was rough and the food was just okay.",
    "Wanted to like it but it didn't deliver.",
    "Felt overpriced for what we got.",
    "Probably wouldn't recommend it.",
    "Went on a bad day maybe — but underwhelming.",
    "Below average. There are better spots nearby.",
    "Not the experience I was hoping for."
  ],
  1: [
    "Really not a fan. Waste of money.",
    "Poor experience overall. Would not return.",
    "Wouldn't recommend to anyone honestly.",
    "Bad service and disappointing food.",
    "Skip it — there are way better options."
  ]
};

// ── Helpers ─────────────────────────────────────────────
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Pick a star rating that clusters around the restaurant's actual rating.
function pickRating(restaurantRating) {
  const r = restaurantRating || 4;
  const roll = Math.random();
  if (r >= 4.5) {
    if (roll < 0.65) return 5;
    if (roll < 0.90) return 4;
    if (roll < 0.97) return 3;
    return 2;
  } else if (r >= 4.0) {
    if (roll < 0.40) return 5;
    if (roll < 0.75) return 4;
    if (roll < 0.92) return 3;
    return 2;
  } else if (r >= 3.5) {
    if (roll < 0.20) return 5;
    if (roll < 0.55) return 4;
    if (roll < 0.85) return 3;
    if (roll < 0.97) return 2;
    return 1;
  } else {
    if (roll < 0.10) return 5;
    if (roll < 0.35) return 4;
    if (roll < 0.70) return 3;
    if (roll < 0.92) return 2;
    return 1;
  }
}

// Pick how many reviews this restaurant gets (popular ones get more).
function pickReviewCount(restaurantRating) {
  const r = restaurantRating || 4;
  const roll = Math.random();
  if (r >= 4.5) {
    if (roll < 0.30) return 0;
    if (roll < 0.55) return 1;
    if (roll < 0.80) return 2;
    if (roll < 0.95) return 3;
    return 4;
  } else if (r >= 4.0) {
    if (roll < 0.50) return 0;
    if (roll < 0.75) return 1;
    if (roll < 0.92) return 2;
    return 3;
  } else {
    if (roll < 0.75) return 0;
    if (roll < 0.92) return 1;
    return 2;
  }
}

// ── Seed function ───────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('\n🗑️  Clearing existing reviews...');
    await Review.deleteMany({});
    console.log('   Done!');

    const restaurants = await Restaurant.find({});
    console.log(`\n🍽️  Found ${restaurants.length} restaurants`);

    if (!users.length) {
      console.error('   ❌ No users found — run seed_users_checkins.js first');
      process.exit(1);
    }

    const reviewsToInsert = [];
    for (const r of restaurants) {
      // Match users to the restaurant's school for authenticity
      const schoolUsers = users.filter(u => u.school === r.school);
      if (!schoolUsers.length) continue;

      const count = pickReviewCount(r.rating);
      // Pick `count` distinct reviewers (no duplicate authors per restaurant)
      const shuffled = [...schoolUsers].sort(() => Math.random() - 0.5);
      const reviewers = shuffled.slice(0, count);

      for (const reviewer of reviewers) {
        const rating = pickRating(r.rating);
        const comment = randomItem(REVIEWS[rating]);
        // Spread review timestamps across last 60 days
        const daysAgo = Math.floor(Math.random() * 60);
        const created = new Date(Date.now() - daysAgo * 86400000);

        reviewsToInsert.push({
          restaurant_id: r._id,
          author: reviewer.name,
          rating,
          comment,
          school: r.school,
          created_at: created
        });
      }
    }

    console.log(`\n✍️  Inserting ${reviewsToInsert.length} reviews...`);
    if (reviewsToInsert.length) {
      await Review.insertMany(reviewsToInsert);
    }

    // Make sure every reviewer has a check-in at the place they reviewed
    console.log('\n📍 Adding check-ins for reviewers...');
    const userByName = new Map(users.map(u => [u.name, u]));
    const restaurantById = new Map(restaurants.map(r => [String(r._id), r]));
    const existing = await Checkin.find({}, { user_id: 1, restaurant_place_id: 1 });
    const existingSet = new Set(existing.map(c => `${c.user_id}|${c.restaurant_place_id}`));

    const newCheckins = [];
    for (const review of reviewsToInsert) {
      const user = userByName.get(review.author);
      const restaurant = restaurantById.get(String(review.restaurant_id));
      if (!user || !restaurant) continue;
      const key = `${user.id}|${restaurant.place_id}`;
      if (existingSet.has(key)) continue;
      existingSet.add(key);
      // Visit happened a few days before the review
      const checkinTime = new Date(new Date(review.created_at).getTime() - (1 + Math.floor(Math.random() * 7)) * 86400000);
      newCheckins.push({
        user_id: user.id,
        restaurant_place_id: restaurant.place_id,
        restaurant_name: restaurant.name,
        school: review.school,
        checkin_time: checkinTime
      });
    }
    if (newCheckins.length) {
      await Checkin.insertMany(newCheckins);
    }
    console.log(`   ✅ Added ${newCheckins.length} new check-ins for reviewers`);

    console.log('\n📊 Summary:');
    console.log(`   Total reviews: ${await Review.countDocuments()}`);
    console.log(`   Avg per restaurant: ${(reviewsToInsert.length / restaurants.length).toFixed(1)}`);
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = await Review.countDocuments({ rating: i });
    }
    console.log(`   Star distribution: 5★ ${distribution[5]} | 4★ ${distribution[4]} | 3★ ${distribution[3]} | 2★ ${distribution[2]} | 1★ ${distribution[1]}`);

    console.log('\n🎉 Reviews seed completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();