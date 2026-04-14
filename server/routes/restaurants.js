const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  place_id: String, name: String, lat: Number, lng: Number,
  address: String, rating: Number, review_count: Number,
  price: String, cuisine: String, phone: String,
  photo_url: String, hours: [String], is_open: Boolean,
  school: String, theme: String, deals: [String],
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

router.get('/', async (req, res) => {
  try {
    const { school, cuisine, price, rating, search } = req.query;
    const filter = {};
    if (school) filter.school = school;
    if (cuisine) filter.cuisine = cuisine;
    if (price) filter.price = price;
    if (rating) filter.rating = { $gte: parseFloat(rating) };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const restaurants = await Restaurant.find(filter);
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.get('/special/leaderboard', async (req, res) => {
  try {
    const { school, limit = 10 } = req.query;
    const filter = school ? { school } : {};
    const leaderboard = await Restaurant.find(filter)
      .sort({ rating: -1 })
      .limit(parseInt(limit))
      .select('name rating price cuisine photo_url address school');
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/special/random', async (req, res) => {
  try {
    const { school } = req.query;
    const filter = school ? { school } : {};
    const count = await Restaurant.countDocuments(filter);
    const random = Math.floor(Math.random() * count);
    const restaurant = await Restaurant.findOne(filter).skip(random);
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch random restaurant' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

module.exports = router;
module.exports.Restaurant = Restaurant;
