// Generates matching Thai-dish photos via BytePlus ModelArk Seedream 4.0
// ($0.03/image, or $0 within the 200-image new-user free quota).
//
// The ARK key is read from opencode.json at runtime — it NEVER appears in
// this file, on the command line, or in git (opencode.json is gitignored).
//
// Usage:
//   node scripts/gen-food-images.mjs --only=kaphrao   (test one)
//   node scripts/gen-food-images.mjs --all             (all 22, skips existing)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'images');
const ENDPOINT = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';
const MODEL = 'seedream-4-0-250828'; // cheapest Seedream tier: $0.03/image

// Filenames MUST match FOOD_META `file` in src/lib/food.ts
const JOBS = [
  ['kaphrao', 'kaphrao.jpg', 'Overhead Thai street-food photo, steamed jasmine rice with spicy minced pork holy-basil stir-fry (pad kaphrao), crispy-edged fried egg on top, on white ceramic plate, school canteen table, natural daylight, appetizing, no hands, no text'],
  ['curry-rice', 'curry-rice.jpg', 'Overhead Thai curry rice photo, jasmine rice with green curry chicken in small bowl, Thai omelette strip, on banana-leaf lined tray, canteen style, daylight, appetizing, no text'],
  ['omelette', 'omelette.jpg', 'Thai-style crispy fluffy pork omelette (khai jiao) over jasmine rice, fish sauce with chilies on side, white plate, canteen table, daylight, close-up, no text'],
  ['fried-rice', 'fried-rice.jpg', 'Thai shrimp fried rice (khao pad goong) with large prawns, cucumber and lime wedge, white plate, overhead canteen photo, daylight, appetizing, no text'],
  ['boat-noodle', 'boat-noodle.jpg', 'Thai boat noodles (kuay teow ruea) small bowl, dark concentrated pork broth, rice noodles, sliced pork, pork ball, morning glory, fried garlic, on wooden canteen table, steam, overhead, no text'],
  ['dry-noodle', 'dry-noodle.jpg', 'Thai dry egg noodles (bami haeng) with BBQ red pork slices, wontons, bok choy, crushed peanut, white bowl, overhead canteen photo, daylight, no text'],
  ['pink-noodle', 'pink-noodle.jpg', 'Thai yen ta fo pink noodle soup, translucent pink broth, fish balls, squid, morning glory, fried wonton crisp, white bowl, overhead, steam, daylight, no text'],
  ['rad-na', 'rad-na.jpg', 'Thai rad-na crispy egg noodles with pork gravy sauce and kale, white plate, canteen table, overhead, daylight, no text'],
  ['fried-chicken', 'fried-chicken.jpg', 'Hat Yai Thai fried chicken, golden crispy drumsticks with crispy fried shallots on top, sticky rice in plastic bag beside, banana leaf tray, canteen style, daylight, no text'],
  ['biryani', 'biryani.jpg', 'Thai chicken biryani (khao mok gai) yellow turmeric rice with fried chicken leg, pickled green chili sauce, sliced cucumber, white plate, overhead canteen photo, no text'],
  ['sticky-chicken', 'sticky-chicken.jpg', 'Thai sticky rice with crispy fried chicken in paper bag, sweet chili sauce cup, banana leaf, school canteen table, overhead daylight photo, no text'],
  ['bubble-tea', 'bubble-tea.jpg', 'Taiwanese brown-sugar bubble milk tea in clear plastic cup, black tapioca pearls, tiger stripes, dome lid, pastel pink canteen background, product photo, no text'],
  ['matcha', 'matcha.jpg', 'Iced matcha latte layered green tea and fresh milk in tall plastic cup, school drink-stall background, product photo, daylight, no text'],
  ['cocoa', 'cocoa.jpg', 'Iced cocoa with whipped cream in tall plastic cup, chocolate drizzle, dark brown drink, canteen drink stall background, product photo, no text'],
  ['toast', 'toast.jpg', 'Thai grilled toast with pandan custard (sangkhaya) dip, golden toasted white bread triangles on paper tray, canteen stall photo, daylight, no text'],
  ['shaved-ice', 'shaved-ice.jpg', 'Thai shaved-ice dessert (pang yen cha thai) orange Thai-tea shaved ice with whipped cream and condensed milk in plastic cup, long spoon, canteen stall, daylight, no text'],
  ['soup', 'soup.jpg', 'Thai clear pork soup with egg tofu and seaweed (tom chued) in white bowl with spoon, steam, canteen table, daylight overhead photo, no text'],
  ['veg-side', 'veg-side.jpg', 'Thai shrimp-paste chili dip (nam phrik kapi) small bowl with fresh raw vegetables, cucumber long beans cabbage, banana-leaf tray, canteen photo, daylight, no text'],
  ['dumpling', 'dumpling.jpg', 'Deep-fried crispy pork wontons (kiew krob) golden puffs with sweet plum sauce dip, white plate, canteen table, close-up daylight, no text'],
  ['fried-egg', 'fried-egg.jpg', 'Crispy-edged Thai fried egg sunny side up on small white plate, fish sauce with chilies beside, extreme close-up canteen photo, daylight, no text'],
  ['suki', 'suki.jpg', 'Thai dry suki (sukiyaki haeng) glass noodles with seafood shrimp squid, morning glory, suki dipping sauce cup, white plate, canteen photo, daylight, no text'],
  ['bowl', 'bowl.jpg', 'Simple Thai rice-and-curry canteen set on stainless tray, rice bowl plus two side dishes, overhead school canteen photo, daylight, appetizing, no text'],
];

function getKey() {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'opencode.json'), 'utf8'));
  const key = cfg?.mcp?.['mcp-image']?.environment?.ARK_API_KEY;
  if (!key || key.includes('PASTE')) throw new Error('ARK_API_KEY missing in opencode.json');
  return key;
}

async function generate(apiKey, prompt) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 300000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${prompt}\n\nOutput aspect ratio: 4:3.`,
        size: '1K',
        response_format: 'b64_json',
        output_format: 'jpg',
        stream: false,
        watermark: false,
        sequential_image_generation: 'disabled',
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('No b64_json in response: ' + JSON.stringify(data).slice(0, 300));
    return Buffer.from(b64, 'base64');
  } finally {
    clearTimeout(t);
  }
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')),
);
const only = args.only ?? null;
const runAll = args.all != null;

const selected = only ? JOBS.filter(([k]) => k === only) : runAll ? JOBS : [];
if (only && selected.length === 0) {
  console.error(`Unknown kind "${only}". Valid: ${JOBS.map(([k]) => k).join(', ')}`);
  process.exit(1);
}
if (selected.length === 0) {
  console.error('Usage: node scripts/gen-food-images.mjs --only=<kind> | --all');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const apiKey = getKey();
let ok = 0;
for (const [kind, file, prompt] of selected) {
  const dest = join(OUT_DIR, file);
  if (existsSync(dest)) {
    console.log(`SKIP ${file} (exists)`);
    continue;
  }
  try {
    const buf = await generate(apiKey, prompt);
    writeFileSync(dest, buf);
    ok++;
    console.log(`OK ${file} (${(buf.length / 1024).toFixed(0)} KB) [${ok}/${selected.length}]`);
  } catch (e) {
    console.error(`FAIL ${file}: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 3000));
}
console.log(`Done: ${ok} generated, ${selected.length - ok} skipped/failed.`);
