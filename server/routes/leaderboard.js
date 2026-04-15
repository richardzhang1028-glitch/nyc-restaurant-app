const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// We re-use the Checkin and User models registered by their own route files.
// mongoose.model('Name') returns the existing model if already defined.
const Checkin = mongoose.model('Checkin');
const User = mongoose.model('User');

// ── GET /api/leaderboard  ─────────────────────────────
// Returns top users ranked by check-in count.
// Query params:
//   school=columbia|nyu  (optional: filter to one school)
//   limit=N              (optional: default 10)
//
// How it works:
//   1. Match check-ins by school (if provided)
//   2. Group by user_id, count rows per user
//   3. Sort descending by count
//   4. Take top N
//   5. Join user info (name, school, theme) from the users collection
router.get('/', async (req, res) => {
  try {
    const { school, limit = 10 } = req.query;
    const match = school ? { school } : {};

    const ranking = await Checkin.aggregate([
      { $match: match },
      { $group: { _id: '$user_id', checkin_count: { $sum: 1 } } },
      { $sort: { checkin_count: -1 } },
      { $limit: parseInt(limit) },
      // Bring in user info from the users collection
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'id',
          as: 'user'
      }},
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: 0,
          user_id: '$_id',
          checkin_count: 1,
          name: '$user.name',
          school: '$user.school',
          theme: '$user.theme'
      }}
    ]);

    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ── GET /api/leaderboard/restaurants  ─────────────────
// Bonus: top restaurants by check-in count (the other half of Person 4's original summary).
router.get('/restaurants', async (req, res) => {
  try {
    const { school, limit = 10 } = req.query;
    const match = school ? { school } : {};

    const ranking = await Checkin.aggregate([
      { $match: match },
      { $group: {
          _id: '$restaurant_place_id',
          restaurant_name: { $first: '$restaurant_name' },
          school: { $first: '$school' },
          checkin_count: { $sum: 1 }
      }},
      { $sort: { checkin_count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch restaurant leaderboard' });
  }
});

module.exports = router;