require('dotenv').config();
const express = require('express');
const connectDB = require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────
const cors = require('cors');
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Database ────────────────────────────────────────
connectDB();

// ── Routes ──────────────────────────────────────────
app.use('/api/restaurants', require('./server/routes/restaurants'));
app.use('/api/reviews', require('./server/routes/reviews'));
app.use('/api/favourites', require('./server/routes/favourites'));
app.use('/api/deals', require('./server/routes/deals'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/checkins', require('./server/routes/checkins'));
app.use('/api/leaderboard', require('./server/routes/leaderboard'));

// ── Health check ────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// ── Error handler ───────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});