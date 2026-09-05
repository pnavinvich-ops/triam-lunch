// Curated exact-dish image fix — every menu item gets a UNIQUE, category-correct
// Unsplash photo (all IDs HTTP-200 verified 2026-09-05). Replaces the old bug where
// seed-menu.mjs reused the same ~8 photo IDs across different dishes, plus the
// loremflickr random images and one dead Unsplash ID (1482049016688 → 404).
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env', 'utf8');
const url = env.match(/SUPABASE_URL=(.+)/)[1].trim();
const svc = env.match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const sb = createClient(url, svc);
const U = (id) => `https://images.unsplash.com/photo-${id}?w=400&q=80&auto=format&fit=crop`;

const fixes = {
  // ร้านข้าวแกงป้าอ้วน — rice + curry / soup / egg
  'ข้าวกะเพราหมูสับ + ไข่ดาว': U('1455619452474-d2be8b1e70cd'), // wok stir-fry
  'ข้าวแกงเขียวหวานไก่': U('1565557623262-b51c2513a641'),       // curry bowl
  'ข้าวแกงส้มชะอมกุ้ง': U('1547592166-23ac45744acd'),           // soup bowl
  'ข้าวไข่เจียวหมูสับ': U('1525351484163-7529414344d8'),        // egg breakfast plate
  'น้ำพริกกะปิ + ผักสด': U('1512621776951-a57141f2eefd'),       // fresh veg bowl
  'ต้มจืดเต้าหู้หมูสับ': U('1547592180-85f173990554'),           // clear soup pot
  // ก๋วยเตี๋ยวเรือสยาม — noodles
  'ก๋วยเตี๋ยวเรือหมู น้ำตก': U('1569718212165-3a8278d5f624'),    // noodle soup bowl
  'ก๋วยเตี๋ยวเรือเนื้อ น้ำตก': U('1585032226651-759b368d7246'),  // noodle bowl
  'บะหมี่แห้งหมูแดง': U('1552611052-33e04de081de'),             // dry noodles
  'เย็นตาโฟ': U('1563379091339-03b21ab4a4f8'),                  // stir-fried noodles
  'เกี๊ยวกรอบ': U('1496116218417-1a781b1c416c'),                // dumplings/wontons
  // ไก่ทอดหาดใหญ่ บังยี — chicken / rice
  'ข้าวหมกไก่': U('1589302168068-964664d93dc0'),                // biryani rice + chicken
  'ไก่ทอดหาดใหญ่ (2 ชิ้น)': U('1562967914-608f82629710'),       // fried chicken
  'ข้าวเหนียวไก่ทอด': U('1606491956689-2ea866880c84'),          // crispy chicken
  'ซุปไก่': U('1604152135912-04a022e23696'),                    // chicken soup
  'หอมเจียว': U('1596040033229-a9821ebd058d'),                  // spices/condiment
  // ชานมไข่มุก Chill Bar — drinks / dessert
  'ชานมไข่มุกบราวน์ชูการ์': U('1579954115545-a95591f28bfc'),    // bubble tea
  'ชาเขียวมัทฉะลาเต้': U('1536256263959-770b48d82b0a'),         // matcha
  'โกโก้เย็น': U('1551024506-0bccd828d307'),                    // chocolate drink
  'ขนมปังปิ้งสังขยา': U('1484723091739-30a097e8f929'),          // toast
  'ปังเย็นชาไทย': U('1563805042-7684c019e1cb'),                 // shaved ice / sundae
  // ครัวคุณแม่ — wok / fried rice
  'ข้าวผัดกะเพราหมูกรอบ': U('1555939594-58d7cb561ad1'),         // grilled/BBQ pork
  'ข้าวผัดกุ้ง': U('1512058564366-18510be2db19'),               // fried rice bowl
  'ราดหน้าหมี่กรอบ': U('1563245372-f21724e3856d'),              // gravy noodles
  'ผัดซีอิ๊ว': U('1559314809-0d155014e29e'),                    // stir-fried flat noodles
  'สุกี้แห้งทะเล': U('1540189549336-e6e99c3679fe'),             // veggie suki bowl
  'ไข่ดาวเพิ่ม': U('1608039829572-78524f79c4c7'),               // fried eggs
};

let ok = 0, missing = [];
for (const [name, img] of Object.entries(fixes)) {
  const { error, count } = await sb.from('lunch_menu_items').update({ image_url: img }).eq('name', name);
  if (error) { console.log('ERR', name, error.message); continue; }
  // verify row exists
  const chk = await sb.from('lunch_menu_items').select('id', { count: 'exact', head: true }).eq('name', name);
  if ((chk.count ?? 0) === 0) missing.push(name); else ok++;
}
console.log('menu items updated:', ok, 'of', Object.keys(fixes).length);
if (missing.length) console.log('NOT FOUND (name mismatch):', missing);

// store covers — unique, match store type
const storeFixes = {
  'ร้านข้าวแกงป้าอ้วน': U('1504674900247-0877df9cc836'),        // rice + dishes spread
  'ก๋วยเตี๋ยวเรือสยาม': U('1555396273-367ea4eb4db5'),           // restaurant dishes
  'ไก่ทอดหาดใหญ่ บังยี': U('1569058242253-92a9c755a0ec'),      // chicken
  'ชานมไข่มุก Chill Bar': U('1558857563-b371033873b8'),        // drinks/dessert
  'ครัวคุณแม่ — อาหารตามสั่ง': U('1548943487-a2e4e43b4853'),   // wok stew pot
};
for (const [n, u] of Object.entries(storeFixes)) {
  const { error } = await sb.from('lunch_stores').update({ image_url: u }).eq('name', n);
  if (error) console.log('STORE ERR', n, error.message);
}
console.log('store covers fixed');

// uniqueness audit
const { data: all } = await sb.from('lunch_menu_items').select('name,image_url');
const seen = {};
for (const r of all ?? []) {
  seen[r.image_url] = seen[r.image_url] || [];
  seen[r.image_url].push(r.name);
}
const dupes = Object.entries(seen).filter(([, v]) => v.length > 1);
console.log('total items:', all?.length, '| duplicate image groups:', dupes.length);
for (const [u, v] of dupes) console.log('DUPE', u, v);
