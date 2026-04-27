// ── seed_more_checkins_and_replies.js ─────────────────────
// Adds more mock check-ins (so most restaurants have some) and
// generates mock replies on ~30% of existing reviews.
// Run with:  node data/seed_more_checkins_and_replies.js
// Safe to re-run.

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

const reviewSchema = new mongoose.Schema({
  restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  author: { type: String, default: 'Anonymous' },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String, required: true },
  school: { type: String },
  parent_review_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
  created_at: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// ── Reply templates ─────────────────────────────────
const REPLY_TEMPLATES = {
  agree: [
    "Totally agree, great spot!",
    "Same experience for me — love this place.",
    "Yes! Glad someone else likes it as much as I do.",
    "Couldn't have said it better.",
    "Felt the exact same way last time I went.",
    "100%. One of my go-tos."
  ],
  disagree: [
    "Hmm, my experience was different. Maybe it depends on the day.",
    "Really? I felt the opposite tbh.",
    "Interesting — must've gone on a good day then.",
    "Different vibe for me but I get it."
  ],
  question: [
    "What did you order? Trying to decide what to get.",
    "When did you go? Wondering if it's still like this.",
    "Did you sit inside or outside?",
    "Was it crowded? Thinking of going this weekend.",
    "Is it good for groups or more of a date spot?"
  ],
  recommend: [
    "If you liked this, try the lunch special — even better.",
    "Next time get the noodles, you won't regret it.",
    "Go on a weekday if you can — way less crowded.",
    "Try the chef's recommendation, it's a hidden gem.",
    "Pro tip: order ahead, the wait can be brutal at peak hours."
  ],
  short: [
    "Same!",
    "Big agree.",
    "+1",
    "Honestly yeah.",
    "Facts.",
    "Co-signed."
  ]
};

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickReplyType() {
  const roll = Math.random();
  if (roll < 0.40) return 'agree';
  if (roll < 0.55) return 'short';
  if (roll < 0.70) return 'recommend';
  if (roll < 0.85) return 'question';
  return 'disagree';
}

// Pick how many extra check-ins this restaurant gets
function pickExtraCheckins(rating) {
  const r = rating || 3.8;
  const roll = Math.random();
  if (r >= 4.5) {
    // Popular: 0-3 extra
    if (roll < 0.20) return 0;
    if (roll < 0.50) return 1;
    if (roll < 0.80) return 2;
    return 3;
  } else if (r >= 4.0) {
    // Average: 0-2 extra
    if (roll < 0.40) return 0;
    if (roll < 0.75) return 1;
    return 2;
  } else {
    // Lower-rated: 0-1 extra
    if (roll < 0.65) return 0;
    return 1;
  }
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // ─────────── PART 1: ADD CHECK-INS ───────────
    console.log('\n📍 Generating extra check-ins...');
    const restaurants = await Restaurant.find({});
    console.log(`   Found ${restaurants.length} restaurants`);

    const newCheckins = [];
    for (const r of restaurants) {
      const schoolUsers = users.filter(u => u.school === r.school);
      if (!schoolUsers.length) continue;

      const count = pickExtraCheckins(r.rating);
      for (let i = 0; i < count; i++) {
        const reviewer = randomItem(schoolUsers);
        // Spread over last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const hoursAgo = Math.floor(Math.random() * 24);
        const checkinTime = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);

        newCheckins.push({
          user_id: reviewer.id,
          restaurant_place_id: r.place_id,
          restaurant_name: r.name,
          school: r.school,
          checkin_time: checkinTime
        });
      }
    }

    console.log(`   ✅ Inserting ${newCheckins.length} new check-ins...`);
    if (newCheckins.length) {
      await Checkin.insertMany(newCheckins);
    }

    const totalCheckins = await Checkin.countDocuments();
    console.log(`   Total check-ins in DB: ${totalCheckins}`);

    // Coverage stats
    const distinctRestaurants = await Checkin.distinct('restaurant_place_id');
    const coverage = (distinctRestaurants.length / restaurants.length * 100).toFixed(1);
    console.log(`   Restaurants with check-ins: ${distinctRestaurants.length}/${restaurants.length} (${coverage}%)`);

    // ─────────── PART 2: ADD REPLIES ───────────
    console.log('\n💬 Generating mock replies...');

    // Clear existing replies (parent_review_id is set)
    await Review.deleteMany({ parent_review_id: { $ne: null } });
    console.log('   Cleared existing replies');

    // Get top-level reviews
    const topReviews = await Review.find({ parent_review_id: null });
    console.log(`   Found ${topReviews.length} top-level reviews`);

    const newReplies = [];
    for (const review of topReviews) {
      // ~30% chance to get replies
      if (Math.random() > 0.30) continue;

      // 1-3 replies per review (mostly 1)
      const replyCount = Math.random() < 0.70 ? 1 : Math.random() < 0.90 ? 2 : 3;

      // Pick reviewers from the same school, but not the original author
      const schoolUsers = users.filter(u =>
        u.school === review.school && u.name !== review.author
      );
      if (!schoolUsers.length) continue;

      const shuffled = [...schoolUsers].sort(() => Math.random() - 0.5);
      const repliers = shuffled.slice(0, replyCount);

      for (const replier of repliers) {
        const type = pickReplyType();
        const comment = randomItem(REPLY_TEMPLATES[type]);

        // Reply timestamp: 1 hour to 7 days after original review
        const minutesAfter = 60 + Math.floor(Math.random() * 7 * 24 * 60);
        const replyTime = new Date(new Date(review.created_at).getTime() + minutesAfter * 60000);

        newReplies.push({
          restaurant_id: review.restaurant_id,
          author: replier.name,
          comment,
          school: review.school,
          parent_review_id: review._id,
          created_at: replyTime
        });
      }
    }

    console.log(`   ✅ Inserting ${newReplies.length} replies...`);
    if (newReplies.length) {
      await Review.insertMany(newReplies);
    }

    const totalReviews = await Review.countDocuments({ parent_review_id: null });
    const totalReplies = await Review.countDocuments({ parent_review_id: { $ne: null } });
    console.log(`\n📊 Final summary:`);
    console.log(`   Top-level reviews: ${totalReviews}`);
    console.log(`   Replies: ${totalReplies}`);
    console.log(`   Total check-ins: ${totalCheckins}`);
    console.log(`   Restaurant coverage: ${coverage}%`);

    console.log('\n🎉 Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();