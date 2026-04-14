require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// ── 导入数据 ────────────────────────────────────────
const restaurants = require('./restaurants.json');
const deals = require('./deals.json');

// ── Schemas ─────────────────────────────────────────
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

// ── 主函数 ──────────────────────────────────────────
async function seed() {
    try {
        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        // 清空旧数据
        console.log('\n🗑️  Clearing old data...');
        await Restaurant.deleteMany({});
        await Deal.deleteMany({});
        console.log('   Done!');

        // 导入餐厅数据
        console.log('\n🍽️  Inserting restaurants...');
        const insertedRestaurants = await Restaurant.insertMany(restaurants);
        console.log(`   ✅ ${insertedRestaurants.length} restaurants inserted`);

        // 导入deals数据
        console.log('\n🎫  Inserting deals...');
        const insertedDeals = await Deal.insertMany(deals);
        console.log(`   ✅ ${insertedDeals.length} deals inserted`);

        // 统计
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