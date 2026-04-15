// ── seed_users_checkins.js ───────────────────────────────────────
// Loads mock users and check-ins into MongoDB.
// Run with:  node data/seed_users_checkins.js
// Safe to re-run: it clears existing users and check-ins first.

require('dotenv').config();
const mongoose = require('mongoose');
const users = require('./users.json');
const checkins = require('./checkins.json');

// ── Schemas (kept in sync with the route files) ─────
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: String,
  email: { type: String, unique: true },
  school: String,
  theme: String,
  friends: [Number],
  password: String
});

const checkinSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  restaurant_place_id: { type: String, required: true },
  restaurant_name: String,
  school: String,
  checkin_time: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Checkin = mongoose.model('Checkin', checkinSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear old data
    console.log('\n🗑️  Clearing old users and check-ins...');
    await User.deleteMany({});
    await Checkin.deleteMany({});
    console.log('   Done!');

    // Insert users
    console.log('\n👥 Inserting users...');
    const insertedUsers = await User.insertMany(users);
    console.log(`   ✅ ${insertedUsers.length} users inserted`);

    // Insert check-ins — strip numeric "id" field if present so Mongo auto-generates _id
    console.log('\n📍 Inserting check-ins...');
    const cleanedCheckins = checkins.map(c => {
      const { id, ...rest } = c;
      return rest;
    });
    const insertedCheckins = await Checkin.insertMany(cleanedCheckins);
    console.log(`   ✅ ${insertedCheckins.length} check-ins inserted`);

    // Summary
    console.log('\n📊 Database summary:');
    console.log(`   Users:     ${await User.countDocuments()}`);
    console.log(`   Columbia:  ${await User.countDocuments({ school: 'columbia' })}`);
    console.log(`   NYU:       ${await User.countDocuments({ school: 'nyu' })}`);
    console.log(`   Check-ins: ${await Checkin.countDocuments()}`);

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();