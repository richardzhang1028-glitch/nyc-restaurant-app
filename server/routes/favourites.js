const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── Favourite Schema ────────────────────────────────
const favouriteSchema = new mongoose.Schema({
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

const Favourite = mongoose.model('Favourite', favouriteSchema);

// ── GET /api/favourites ─────────────────────────────
// 获取所有收藏
router.get('/', async (req, res) => {
    try {
        const { school } = req.query;
        const filter = school ? { school } : {};
        const favourites = await Favourite.find(filter)
            .sort({ created_at: -1 });
        res.json(favourites);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch favourites' });
    }
});

// ── POST /api/favourites ────────────────────────────
// 添加收藏
router.post('/', async (req, res) => {
    try {
        const {
            restaurant_id,
            restaurant_name,
            restaurant_photo,
            restaurant_cuisine,
            restaurant_rating,
            restaurant_price,
            school
        } = req.body;

        // 验证必填字段
        if (!restaurant_id) {
            return res.status(400).json({
                error: 'restaurant_id is required'
            });
        }

        // 检查是否已经收藏
        const existing = await Favourite.findOne({ restaurant_id });
        if (existing) {
            return res.status(400).json({
                error: 'Already in favourites'
            });
        }

        const favourite = new Favourite({
            restaurant_id,
            restaurant_name,
            restaurant_photo,
            restaurant_cuisine,
            restaurant_rating,
            restaurant_price,
            school
        });

        await favourite.save();
        res.status(201).json(favourite);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add favourite' });
    }
});

// ── DELETE /api/favourites/:id ──────────────────────
// 取消收藏
router.delete('/:restaurant_id', async (req, res) => {
    try {
        const favourite = await Favourite.findOneAndDelete({
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

// ── GET /api/favourites/check/:restaurant_id ────────
// 检查某餐厅是否已收藏
router.get('/check/:restaurant_id', async (req, res) => {
    try {
        const favourite = await Favourite.findOne({
            restaurant_id: req.params.restaurant_id
        });
        res.json({ isFavourite: !!favourite });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to check favourite' });
    }
});

module.exports = router;
module.exports.Favourite = Favourite;