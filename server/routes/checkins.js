const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── Checkin schema ───────────────────────────────────
// Matches the shape of data/checkins.json from Person 4
const checkinSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  restaurant_place_id: { type: String, required: true },  // matches Restaurant.place_id
  restaurant_name: { type: String },                       // denormalized for easy display
  school: { type: String },                                // 'columbia' or 'nyu'
  checkin_time: { type: Date, default: Date.now }
});

// Useful indexes: fast lookup by user + leaderboard aggregation
checkinSchema.index({ user_id: 1 });
checkinSchema.index({ school: 1 });

const Checkin = mongoose.model('Checkin', checkinSchema);

// ── POST /api/checkins  ───────────────────────────────
// Record a new check-in. Called from the frontend when user taps "Check In".
// Body: { user_id, restaurant_place_id, restaurant_name, school }
router.post('/', async (req, res) => {
  try {
    const { user_id, restaurant_place_id, restaurant_name, school } = req.body;
    if (!user_id || !restaurant_place_id) {
      return res.status(400).json({ error: 'user_id and restaurant_place_id are required' });
    }
    // Check if user already has a check-in here
    const existing = await Checkin.findOne({ user_id, restaurant_place_id });
    if (existing) {
      return res.status(200).json(existing);
    }
    const checkin = await Checkin.create({
      user_id,
      restaurant_place_id,
      restaurant_name,
      school,
      checkin_time: new Date()
    });
    res.status(201).json(checkin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

// ── GET /api/checkins  ────────────────────────────────
// List check-ins, optionally filtered by user_id or school.
// Used by: user profile (my check-ins), friends' activity feed
router.get('/', async (req, res) => {
  try {
    const { user_id, school, limit = 100 } = req.query;
    const filter = {};
    if (user_id) filter.user_id = parseInt(user_id);
    if (school) filter.school = school;
    const checkins = await Checkin.find(filter)
      .sort({ checkin_time: -1 })
      .limit(parseInt(limit));
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// ── GET /api/checkins/user/:userId  ───────────────────
// Convenience endpoint: all check-ins for a single user.
router.get('/user/:userId', async (req, res) => {
  try {
    const checkins = await Checkin.find({ user_id: parseInt(req.params.userId) })
      .sort({ checkin_time: -1 });
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user check-ins' });
  }
});

// ── GET /api/checkins/restaurant/:place_id  ───────────
// Get all check-ins at a specific restaurant, with user info joined in.
// Used by the restaurant detail page to show "who checked in here".
router.get('/restaurant/:place_id', async (req, res) => {
  try {
    const checkins = await Checkin.aggregate([
      // Match check-ins at this specific restaurant
      { $match: { restaurant_place_id: req.params.place_id } },
      // Sort newest first
      { $sort: { checkin_time: -1 } },
      // Limit to 50 most recent
      { $limit: 50 },
      // Join with users collection to get name + school
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: 'id',
          as: 'user'
        }
      },
      // Flatten the user array
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      // Shape output
      {
        $project: {
          _id: 1,
          user_id: 1,
          user_name: '$user.name',
          school: '$user.school',
          checkin_time: 1,
          restaurant_name: 1
        }
      }
    ]);
    res.json(checkins);
  } catch (err) {
    console.error('Error fetching restaurant check-ins:', err);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});
// ── DELETE /api/checkins  ────────────────────────────
// Remove a user's check-in at a specific restaurant.
router.delete('/', async (req, res) => {
  try {
    const { user_id, restaurant_place_id } = req.body;
    if (!user_id || !restaurant_place_id) {
      return res.status(400).json({ error: 'user_id and restaurant_place_id are required' });
    }
    const result = await Checkin.deleteOne({ user_id, restaurant_place_id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Check-in not found' });
    }
    res.json({ message: 'Check-in removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove check-in' });
  }
});
module.exports = router;
module.exports.Checkin = Checkin;