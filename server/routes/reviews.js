const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ── Review Schema ───────────────────────────────────
const reviewSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    author: { type: String, default: 'Anonymous' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    school: { type: String },
    created_at: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// ── GET /api/reviews/:restaurant_id ─────────────────
// 获取某餐厅的所有评价
router.get('/:restaurant_id', async (req, res) => {
    try {
        const reviews = await Review.find({
            restaurant_id: req.params.restaurant_id
        }).sort({ created_at: -1 }); // 最新的在前

        res.json(reviews);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// ── POST /api/reviews ───────────────────────────────
// 提交新评价
router.post('/', async (req, res) => {
    try {
        const { restaurant_id, author, rating, comment, school } = req.body;

        // 验证必填字段
        if (!restaurant_id || !rating || !comment) {
            return res.status(400).json({
                error: 'restaurant_id, rating and comment are required'
            });
        }

        // 验证评分范围
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: 'Rating must be between 1 and 5'
            });
        }

        const review = new Review({
            restaurant_id,
            author: author || 'Anonymous',
            rating: Number(rating),
            comment,
            school
        });

        await review.save();
        res.status(201).json(review);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// ── DELETE /api/reviews/:id ─────────────────────────
// 删除评价
router.delete('/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ message: 'Review deleted' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;
module.exports.Review = Review;