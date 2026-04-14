require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
console.log('🚀 Script started');
console.log('API KEY:', process.env.GOOGLE_API_KEY ? '✅ Found' : '❌ Missing');

const API_KEY = process.env.GOOGLE_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// ── 24个搜索点（Columbia + NYU 各12个）─────────────────────────
const SEARCH_POINTS = [

    // Columbia 区域（12个点，覆盖3公里）
    { name: 'columbia', theme: 'blue', lat: 40.8075, lng: -73.9626, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8155, lng: -73.9626, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.7995, lng: -73.9626, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8075, lng: -73.9750, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8075, lng: -73.9500, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8200, lng: -73.9750, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8200, lng: -73.9500, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.7950, lng: -73.9750, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.7950, lng: -73.9500, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8240, lng: -73.9626, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.7880, lng: -73.9626, radius: 500 },
    { name: 'columbia', theme: 'blue', lat: 40.8075, lng: -73.9380, radius: 500 },

    // NYU 区域（12个点，覆盖3公里）
    { name: 'nyu', theme: 'purple', lat: 40.7295, lng: -73.9965, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7375, lng: -73.9965, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7215, lng: -73.9965, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7295, lng: -74.0080, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7295, lng: -73.9850, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7420, lng: -74.0080, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7420, lng: -73.9850, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7170, lng: -74.0080, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7170, lng: -73.9850, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7450, lng: -73.9965, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7140, lng: -73.9965, radius: 500 },
    { name: 'nyu', theme: 'purple', lat: 40.7295, lng: -74.0200, radius: 500 },
];

// ── 工具函数 ────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function priceLevel(level) {
    const map = { 0: 'Free', 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
    return map[level] ?? '$$';
}

function getCuisine(types = []) {
    const map = {
        'chinese_restaurant': 'Chinese',
        'japanese_restaurant': 'Japanese',
        'italian_restaurant': 'Italian',
        'mexican_restaurant': 'Mexican',
        'indian_restaurant': 'Indian',
        'thai_restaurant': 'Thai',
        'american_restaurant': 'American',
        'pizza_restaurant': 'Pizza',
        'sushi_restaurant': 'Sushi',
        'korean_restaurant': 'Korean',
        'mediterranean_restaurant': 'Mediterranean',
        'vietnamese_restaurant': 'Vietnamese',
        'burger_restaurant': 'Burgers',
        'sandwich_shop': 'Sandwiches',
        'cafe': 'Cafe',
        'seafood_restaurant': 'Seafood',
        'steak_house': 'Steakhouse',
        'french_restaurant': 'French',
        'spanish_restaurant': 'Spanish',
        'middle_eastern_restaurant': 'Middle Eastern',
    };
    for (const t of types) {
        if (map[t]) return map[t];
    }
    return 'Restaurant';
}

// ── Step 1: 抓取附近餐厅列表 ────────────────────────────────────
async function fetchNearby(point, pointIndex, total) {
    let results = [];
    let pageToken = null;
    let page = 1;

    process.stdout.write(
        `\n[${pointIndex}/${total}] 📍 ${point.name} (${point.lat}, ${point.lng})\n`
    );

    do {
        const params = {
            location: `${point.lat},${point.lng}`,
            radius: point.radius,
            type: 'restaurant',
            key: API_KEY,
            ...(pageToken && { pagetoken: pageToken })
        };

        try {
            const res = await axios.get(
                `${BASE_URL}/nearbysearch/json`, { params }
            );

            if (res.data.status === 'ZERO_RESULTS') {
                console.log(`   No results found`);
                break;
            }

            if (res.data.status !== 'OK') {
                console.error(`   ❌ Error: ${res.data.status}`);
                break;
            }

            results = [...results, ...res.data.results];
            pageToken = res.data.next_page_token;
            console.log(`   Page ${page}: ${res.data.results.length} found`);
            page++;

            if (pageToken) {
                process.stdout.write(`   Waiting for next page...`);
                await sleep(2000);
                process.stdout.write(` done\n`);
            }

        } catch (err) {
            console.error(`   ❌ Request failed: ${err.message}`);
            break;
        }

    } while (pageToken && page <= 3);

    return results;
}

// ── Step 2: 获取餐厅详细信息 ────────────────────────────────────
async function fetchDetails(placeId) {
    const params = {
        place_id: placeId,
        fields: [
            'name',
            'rating',
            'user_ratings_total',
            'formatted_address',
            'geometry',
            'price_level',
            'types',
            'photos',
            'opening_hours',
            'formatted_phone_number',
        ].join(','),
        key: API_KEY
    };

    try {
        const res = await axios.get(
            `${BASE_URL}/details/json`, { params }
        );
        if (res.data.status !== 'OK') return null;
        return res.data.result;
    } catch (err) {
        return null;
    }
}

// ── Step 3: 去重函数 ─────────────────────────────────────────────
function deduplicate(restaurants) {
    const seen = new Set();
    const unique = [];

    for (const r of restaurants) {
        if (!seen.has(r.place_id)) {
            seen.add(r.place_id);
            unique.push(r);
        }
    }

    return unique;
}

// ── 主函数 ───────────────────────────────────────────────────────
async function main() {

    // API Key 检查
    if (!API_KEY) {
        console.error('❌ Missing GOOGLE_API_KEY in .env');
        process.exit(1);
    }
    console.log('✅ API Key found');
    console.log(`🚀 Starting fetch from ${SEARCH_POINTS.length} search points...\n`);

    // ── Phase 1: 抓取所有搜索点的餐厅列表 ──────────────────────────
    console.log('═══════════════════════════════════');
    console.log('Phase 1: Fetching nearby restaurants');
    console.log('═══════════════════════════════════');

    const rawResults = new Map(); // place_id → { result, school, theme }

    for (let i = 0; i < SEARCH_POINTS.length; i++) {
        const point = SEARCH_POINTS[i];
        const nearby = await fetchNearby(point, i + 1, SEARCH_POINTS.length);

        // 存入Map自动去重
        for (const r of nearby) {
            if (!rawResults.has(r.place_id)) {
                rawResults.set(r.place_id, {
                    result: r,
                    school: point.name,
                    theme: point.theme,
                });
            }
        }

        console.log(`   Unique so far: ${rawResults.size}`);
        await sleep(500);
    }

    console.log(`\n✅ Phase 1 done!`);
    console.log(`   Raw results:    ${[...rawResults.values()].reduce((n) => n + 1, 0)}`);
    console.log(`   Unique places:  ${rawResults.size}`);

    // ── Phase 2: 获取每个餐厅的详细信息 ────────────────────────────
    console.log('\n═══════════════════════════════════');
    console.log('Phase 2: Fetching restaurant details');
    console.log('═══════════════════════════════════');

    const allRestaurants = [];
    const entries = [...rawResults.entries()];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < entries.length; i++) {
        const [placeId, { school, theme }] = entries[i];

        process.stdout.write(
            `\r   [${i + 1}/${entries.length}] Fetching details... (✅${success} ❌${failed})`
        );

        const details = await fetchDetails(placeId);
        await sleep(150);

        if (!details) {
            failed++;
            continue;
        }

        allRestaurants.push({
            place_id: placeId,
            name: details.name,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            address: details.formatted_address,
            rating: details.rating ?? 0,
            review_count: details.user_ratings_total ?? 0,
            price: priceLevel(details.price_level),
            cuisine: getCuisine(details.types ?? []),
            phone: details.formatted_phone_number ?? null,
            photo_url: details.photos?.[0]
                ? `${BASE_URL}/photo?maxwidth=800&photo_reference=${details.photos[0].photo_reference}&key=${API_KEY}`
                : null,
            hours: details.opening_hours?.weekday_text ?? [],
            is_open: details.opening_hours?.open_now ?? null,
            school,
            theme,
            deals: [],
        });

        success++;
    }

    console.log(`\n\n✅ Phase 2 done!`);
    console.log(`   Success: ${success}`);
    console.log(`   Failed:  ${failed}`);

    // ── Phase 3: 保存结果 ───────────────────────────────────────────
    console.log('\n═══════════════════════════════════');
    console.log('Phase 3: Saving results');
    console.log('═══════════════════════════════════');

    if (!fs.existsSync('./data')) fs.mkdirSync('./data');

    // 保存完整JSON
    fs.writeFileSync(
        './data/restaurants.json',
        JSON.stringify(allRestaurants, null, 2)
    );

    // 统计
    const columbia = allRestaurants.filter(r => r.school === 'columbia');
    const nyu = allRestaurants.filter(r => r.school === 'nyu');

    // 按菜系统计
    const cuisineCount = {};
    for (const r of allRestaurants) {
        cuisineCount[r.cuisine] = (cuisineCount[r.cuisine] || 0) + 1;
    }
    const topCuisines = Object.entries(cuisineCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    console.log(`\n🎉 All done!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Total restaurants: ${allRestaurants.length}`);
    console.log(`   Columbia: ${columbia.length}`);
    console.log(`   NYU:      ${nyu.length}`);
    console.log(`\n🍽️  Top cuisines:`);
    topCuisines.forEach(([cuisine, count]) => {
        console.log(`   ${cuisine}: ${count}`);
    });
    console.log(`\n📁 Saved to: data/restaurants.json`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch(console.error);
