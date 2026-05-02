require('dotenv').config();
const mongoose = require('mongoose');

// import seed data
const restaurants = require('./restaurants.json');
const deals = require('./deals.json');

// schemas
const restaurantSchema = new mongoose.Schema({
    place_id: String,
    name: String,
    lat: Number,
    lng: Number,
    address: String,
    rating: Number,
    review_count: Number,
    price: String,
    cuisine: String,
    phone: String,
    photo_url: String,
    hours: [String],
    is_open: Boolean,
    school: String,
    theme: String,
    deals: [String],
});

const dealSchema = new mongoose.Schema({
    title: String,
    description: String,
    restaurant: String,
    location: String,
    type: String,
    discount: String,
    time: String,
    date: String,
    school: String,
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Deal = mongoose.model('Deal', dealSchema);

// main seed function
async function seed() {
    try {
        // connect to mongodb
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // clear old data
        console.log('\n🗑️  Clearing old data...');
        await Restaurant.deleteMany({});
        await Deal.deleteMany({});
        console.log('   Done!');

        // insert restaurant data
        console.log('\n🍽️  Inserting restaurants...');
        const insertedRestaurants = await Restaurant.insertMany(restaurants);
        console.log(`   ✅ ${insertedRestaurants.length} restaurants inserted`);

        // insert deals data
        console.log('\n🎫  Inserting deals...');
        const insertedDeals = await Deal.insertMany(deals);
        console.log(`   ✅ ${insertedDeals.length} deals inserted`);

        // print database summary
        console.log('\n📊 Database summary:');
        console.log(`   Restaurants: ${await Restaurant.countDocuments()}`);
        console.log(`   Columbia:    ${await Restaurant.countDocuments({ school: 'columbia' })}`);
        console.log(`   NYU:         ${await Restaurant.countDocuments({ school: 'nyu' })}`);
        console.log(`   Deals:       ${await Deal.countDocuments()}`);

        console.log('\n🎉 Seed completed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
}

seed();