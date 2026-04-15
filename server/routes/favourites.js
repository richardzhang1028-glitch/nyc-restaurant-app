const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── Favourite Schema (now user-scoped) ──────────────
const favouriteSchema = new mongoose.Schema({
    user_id: { type: Number, required: true, index: true },     // owns the favourite
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    restaurant_name: String,
    restaurant_photo: String,
    restaurant_cuisine: String,
    restaurant_rating: Number,
    restaurant_price: String,
    school: String,
    created_at: { type: Date, default: Date.now }
});

// A user can only favourite a given restaurant once
favouriteSchema.index({ user_id: 1, restaurant_id: 1 }, { unique: true });

const Favourite = mongoose.model('Favourite', favouriteSchema);

// ── GET /api/favourites?user_id=&school= ────────────
// List a user's favourites (or all if user_id omitted)
router.get('/', async (req, res) => {
    try {
        const { user_id, school } = req.query;
        const filter = {};
        if (user_id) filter.user_id = parseInt(user_id);
        if (school) filter.school = school;
        const favourites = await Favourite.find(filter).sort({ created_at: -1 });
        res.json(favourites);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch favourites' });
    }
});

// ── POST /api/favourites ────────────────────────────
// Body: { user_id, restaurant_id, ...metadata }
router.post('/', async (req, res) => {
    try {
        const {
            user_id,
            restaurant_id,
            restaurant_name,
            restaurant_photo,
            restaurant_cuisine,
            restaurant_rating,
            restaurant_price,
            school
        } = req.body;

        if (!user_id || !restaurant_id) {
            return res.status(400).json({ error: 'user_id and restaurant_id are required' });
        }

        const existing = await Favourite.findOne({ user_id, restaurant_id });
        if (existing) {
            return res.status(400).json({ error: 'Already in favourites' });
        }

        const favourite = await Favourite.create({
            user_id,
            restaurant_id,
            restaurant_name,
            restaurant_photo,
            restaurant_cuisine,
            restaurant_rating,
            restaurant_price,
            school
        });
        res.status(201).json(favourite);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add favourite' });
    }
});

// ── DELETE /api/favourites/:user_id/:restaurant_id ──
// Remove a specific user's favourite
router.delete('/:user_id/:restaurant_id', async (req, res) => {
    try {
        const favourite = await Favourite.findOneAndDelete({
            user_id: parseInt(req.params.user_id),
            restaurant_id: req.params.restaurant_id
        });
        if (!favourite) {
            return res.status(404).json({ error: 'Favourite not found' });
        }
        res.json({ message: 'Removed from favourites' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to remove favourite' });
    }
});

// ── GET /api/favourites/check/:user_id/:restaurant_id ──
// Check whether a user has favourited a restaurant
router.get('/check/:user_id/:restaurant_id', async (req, res) => {
    try {
        const favourite = await Favourite.findOne({
            user_id: parseInt(req.params.user_id),
            restaurant_id: req.params.restaurant_id
        });
        res.json({ isFavourite: !!favourite });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check favourite' });
    }
});

module.exports = router;