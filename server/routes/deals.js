const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── Deal Schema ─────────────────────────────────────
const dealSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    restaurant: { type: String },
    location: { type: String },
    type: { type: String, enum: ['deal', 'coupon', 'free_food', 'event'] },
    discount: { type: String },
    time: { type: String },
    date: { type: String },
    school: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);

// ── GET /api/deals ──────────────────────────────────
// 获取所有deals（支持按学校筛选）
router.get('/', async (req, res) => {
    try {
        const { school, type } = req.query;

        const filter = { is_active: true };
        if (school) filter.school = school;
        if (type) filter.type = type;

        const deals = await Deal.find(filter)
            .sort({ created_at: -1 });

        res.json(deals);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

// ── POST /api/deals ─────────────────────────────────
// 添加新deal
router.post('/', async (req, res) => {
    try {
        const {
            title, description, restaurant,
            location, type, discount,
            time, date, school
        } = req.body;

        if (!title || !description || !school) {
            return res.status(400).json({
                error: 'title, description and school are required'
            });
        }

        const deal = new Deal({
            title, description, restaurant,
            location, type, discount,
            time, date, school
        });

        await deal.save();
        res.status(201).json(deal);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create deal' });
    }
});

module.exports = router;
module.exports.Deal = Deal;