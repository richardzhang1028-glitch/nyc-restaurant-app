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
    rating: { type: Number, min: 1, max: 5 },  // optional now (replies don't have ratings)
    comment: { type: String, required: true },
    school: { type: String },
    parent_review_id: {                          // NEW: if set, this is a reply
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        default: null
    },
    created_at: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// ── GET /api/reviews/:restaurant_id ─────────────────
// Returns top-level reviews with their replies nested in.
router.get('/:restaurant_id', async (req, res) => {
    try {
        // Get top-level reviews (parent_review_id is null)
        const topLevel = await Review.find({
            restaurant_id: req.params.restaurant_id,
            parent_review_id: null
        }).sort({ created_at: -1 });

        // Get all replies for this restaurant
        const replies = await Review.find({
            restaurant_id: req.params.restaurant_id,
            parent_review_id: { $ne: null }
        }).sort({ created_at: 1 });  // oldest first for thread reading order

        // Attach replies to their parent reviews
        const result = topLevel.map(rev => {
            const revObj = rev.toObject();
            revObj.replies = replies.filter(rep => String(rep.parent_review_id) === String(rev._id));
            return revObj;
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// ── POST /api/reviews ───────────────────────────────
// Create a new top-level review (with rating).
router.post('/', async (req, res) => {
    try {
        const { restaurant_id, author, rating, comment, school } = req.body;

        if (!restaurant_id || !rating || !comment) {
            return res.status(400).json({
                error: 'restaurant_id, rating and comment are required'
            });
        }

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
            school,
            parent_review_id: null
        });

        await review.save();
        res.status(201).json(review);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// ── POST /api/reviews/:reviewId/reply ───────────────
// Create a reply to an existing review.
router.post('/:reviewId/reply', async (req, res) => {
    try {
        const { author, comment, school } = req.body;
        if (!comment) {
            return res.status(400).json({ error: 'comment is required' });
        }

        // Find the parent to get the restaurant_id
        const parent = await Review.findById(req.params.reviewId);
        if (!parent) {
            return res.status(404).json({ error: 'Parent review not found' });
        }

        const reply = new Review({
            restaurant_id: parent.restaurant_id,
            author: author || 'Anonymous',
            comment,
            school: school || parent.school,
            parent_review_id: parent._id
        });

        await reply.save();
        res.status(201).json(reply);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save reply' });
    }
});

// ── DELETE /api/reviews/:id ─────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        // Also delete its replies
        await Review.deleteMany({ parent_review_id: req.params.id });
        res.json({ message: 'Review deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

module.exports = router;
module.exports.Review = Review;