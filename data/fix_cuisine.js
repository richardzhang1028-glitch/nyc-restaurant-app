const fs = require('fs');
const data = require('./restaurants.json');

function guessCuisine(name) {
  const n = name.toLowerCase();
  if (n.includes('china') || n.includes('chinese') || n.includes('wok') || n.includes('dumpling') || n.includes('dim sum') || n.includes('peking') || n.includes('cantonese')) return 'Chinese';
  if (n.includes('sushi') || n.includes('japanese') || n.includes('ramen') || n.includes('udon') || n.includes('tokyo') || n.includes('matcha') || n.includes('tempura')) return 'Japanese';
  if (n.includes('korean') || n.includes('korea') || n.includes('bulgogi') || n.includes('kimchi') || n.includes('bibimbap')) return 'Korean';
  if (n.includes('mexican') || n.includes('mexico') || n.includes('taco') || n.includes('burrito') || n.includes('chipotle') || n.includes('cantina') || n.includes('taqueria')) return 'Mexican';
  if (n.includes('pizza') || n.includes('pizzeria') || n.includes('italian') || n.includes('pasta') || n.includes('trattoria') || n.includes('famiglia') || n.includes('romano')) return 'Italian';
  if (n.includes('indian') || n.includes('india') || n.includes('curry') || n.includes('tandoor') || n.includes('masala') || n.includes('punjabi') || n.includes('biryani')) return 'Indian';
  if (n.includes('thai') || n.includes('bangkok') || n.includes('lemongrass') || n.includes('satay')) return 'Thai';
  if (n.includes('vietnamese') || n.includes('vietnam') || n.includes('pho') || n.includes('banh mi') || n.includes('saigon')) return 'Vietnamese';
  if (n.includes('ethiopian') || n.includes('african') || n.includes('massawa') || n.includes('eritrean')) return 'African';
  if (n.includes('mediterranean') || n.includes('greek') || n.includes('falafel') || n.includes('hummus') || n.includes('shawarma') || n.includes('kebab') || n.includes('halal') || n.includes('gyro')) return 'Mediterranean';
  if (n.includes('french') || n.includes('bistro') || n.includes('brasserie') || n.includes('croissant') || n.includes('crepe')) return 'French';
  if (n.includes('burger') || n.includes('five guys') || n.includes('shake shack') || n.includes('grill') || n.includes('diner') || n.includes('steakhouse') || n.includes('steak') || n.includes('wings') || n.includes('american')) return 'American';
  if (n.includes('sandwich') || n.includes('deli') || n.includes('bagel') || n.includes('subway') || n.includes('panini')) return 'Sandwiches';
  if (n.includes('seafood') || n.includes('lobster') || n.includes('crab') || n.includes('oyster')) return 'Seafood';
  if (n.includes('coffee') || n.includes('cafe') || n.includes('starbucks') || n.includes('espresso') || n.includes('roast') || n.includes('brew')) return 'Cafe';
  if (n.includes('juice') || n.includes('smoothie') || n.includes('salad') || n.includes('sweetgreen') || n.includes('vegan') || n.includes('healthy')) return 'Healthy';
  return 'Restaurant';
}

const updated = data.map(r => ({ ...r, cuisine: guessCuisine(r.name) }));

const cuisineCount = {};
updated.forEach(r => { cuisineCount[r.cuisine] = (cuisineCount[r.cuisine] || 0) + 1; });

console.log('\n菜系分布:');
Object.entries(cuisineCount).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

fs.writeFileSync('./data/restaurants.json', JSON.stringify(updated, null, 2));
console.log('\n✅ Done! restaurants.json updated');
console.log('总数:', updated.length);
