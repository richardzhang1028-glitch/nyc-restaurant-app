// ── seed_replies.js ─────────────────────────────────
// Generates mock replies on ~30% of existing reviews.
// Run with:  node data/seed_replies.js
// Safe to re-run: clears existing replies first.

require('dotenv').config();
const mongoose = require('mongoose');
const users = require('./users.json');

// ── Schemas ─────────────────────────────────────────
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

// ── Seed function ───────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('\n💬 Generating mock replies...');

    // Clear existing replies (parent_review_id is set)
    await Review.deleteMany({ parent_review_id: { $ne: null } });
    console.log('   Cleared existing replies');

    // Get top-level reviews
    const topReviews = await Review.find({ parent_review_id: null });
    console.log(`   Found ${topReviews.length} top-level reviews`);

    if (!topReviews.length) {
      console.error('   ❌ No reviews found — run seed_reviews.js first');
      process.exit(1);
    }

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

    // Summary
    const totalReviews = await Review.countDocuments({ parent_review_id: null });
    const totalReplies = await Review.countDocuments({ parent_review_id: { $ne: null } });
    console.log(`\n📊 Summary:`);
    console.log(`   Top-level reviews: ${totalReviews}`);
    console.log(`   Replies: ${totalReplies}`);
    console.log(`   Avg replies per review: ${(totalReplies / totalReviews).toFixed(2)}`);

    console.log('\n🎉 Replies seed completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();