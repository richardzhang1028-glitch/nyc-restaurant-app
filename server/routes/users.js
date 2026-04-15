const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── User schema ──────────────────────────────────────
// Matches the shape of data/users.json from Person 4
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },  // numeric ID, used by friends[] and checkins
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  school: { type: String, required: true },            // 'columbia' or 'nyu'
  theme: { type: String },                              // 'blue' or 'purple'
  friends: [Number],                                    // array of other users' numeric ids
  password: { type: String }                            // optional for now; real auth can come later
});

const User = mongoose.model('User', userSchema);

// ── GET /api/users  ──────────────────────────────────
// List all users, optionally filtered by school.
// Used by: friends page ("add a friend" picker), leaderboard
router.get('/', async (req, res) => {
  try {
    const { school } = req.query;
    const filter = school ? { school } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── GET /api/users/:id  ───────────────────────────────
// Get a single user by numeric id.
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: parseInt(req.params.id) }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── POST /api/users/register  ─────────────────────────
// Create a new user (used during login flow when an email is not yet registered).
router.post('/register', async (req, res) => {
  try {
    const { name, email, school } = req.body;
    if (!name || !email || !school) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // auto-assign a numeric id = current max + 1
    const last = await User.findOne().sort({ id: -1 });
    const newId = last ? last.id + 1 : 1;
    const theme = school === 'columbia' ? 'blue' : 'purple';
    const user = await User.create({ id: newId, name, email, school, theme, friends: [] });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// ── POST /api/users/login  ────────────────────────────
// Very basic login — just look up by email. Good enough for the demo.
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// ── GET /api/users/:id/friends  ───────────────────────
// Returns the full user objects for this user's friends.
router.get('/:id/friends', async (req, res) => {
  try {
    const user = await User.findOne({ id: parseInt(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const friends = await User.find({ id: { $in: user.friends } }).select('-password');
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// ── POST /api/users/:id/friends  ──────────────────────
// Add a friend. Body: { friendId: <number> }
// Adds both directions so friendships are mutual.
router.post('/:id/friends', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const friendId = parseInt(req.body.friendId);
    if (userId === friendId) return res.status(400).json({ error: "Can't friend yourself" });
    await User.updateOne({ id: userId }, { $addToSet: { friends: friendId } });
    await User.updateOne({ id: friendId }, { $addToSet: { friends: userId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// ── DELETE /api/users/:id/friends/:friendId  ──────────
// Remove a friendship (both directions).
router.delete('/:id/friends/:friendId', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const friendId = parseInt(req.params.friendId);
    await User.updateOne({ id: userId }, { $pull: { friends: friendId } });
    await User.updateOne({ id: friendId }, { $pull: { friends: userId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;
module.exports.User = User;