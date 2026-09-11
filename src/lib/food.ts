// Central food-visual system for Triam Lunch.
//
// WHY THIS EXISTS:
// The DB image_urls are Unsplash hotlinks. Audit 2026-09-11 found they are
// generic/Western approximations that DON'T match Thai dish names, e.g.
//  - "ก๋วยเตี๋ยวเรือ" -> Japanese ramen photo (1569718212165)
//  - "ข้าวผัดกุ้ง"    -> Chinese takeout fried rice (1512058564366)
//  - store "ก๋วยเตี๋ยวเรือสยาม" cover -> Western fine-dining spread (1555396273)
//  - "ปังเย็นชาไทย"   -> Western sundae glass (1563805042)
//  - category tiles   -> ramen / sundae / toast stock that mismatches labels
// Plus hotlinking is slow, breakable, and off-brand for a school canteen app.
//
// WHAT THIS FILE DOES:
//  1. `foodKindFor(name, category)` maps any Thai dish name -> a stable FoodKind.
//  2. `FOOD_META` gives each kind a gradient + emoji-free label + a ready-made
//     AI photo prompt (see IMAGE_PROMPTS below) so you can later generate real
//     photos and drop them in `public/images/` with the listed filename.
//  3. Until real photos exist, <FoodArt kind> renders a matching flat SVG
//     illustration — guaranteed to match the description, offline, zero 404s.
//
// TO UPGRADE TO AI PHOTOS LATER:
//  - Generate one 800x600 photo per kind using the prompt in FOOD_META.
//  - Save as `public/images/<file>` (filename listed per kind).
//  - Set `USE_PHOTOS = true` below. FoodArt will auto-prefer the photo and
//    fall back to SVG if the file is missing.

export const USE_PHOTOS = false

export type FoodKind =
  | 'kaphrao' | 'curry-rice' | 'omelette' | 'fried-rice'
  | 'boat-noodle' | 'dry-noodle' | 'pink-noodle' | 'rad-na'
  | 'fried-chicken' | 'biryani' | 'sticky-chicken'
  | 'bubble-tea' | 'matcha' | 'cocoa' | 'toast' | 'shaved-ice'
  | 'soup' | 'veg-side' | 'dumpling' | 'fried-egg' | 'suki' | 'bowl'

interface FoodMeta {
  label: string
  file: string
  from: string
  to: string
  prompt: string
}

export const FOOD_META: Record<FoodKind, FoodMeta> = {
  'kaphrao': { label: 'กะเพราไข่ดาว', file: 'kaphrao.jpg', from: '#FFF3E0', to: '#FFB74D',
    prompt: 'Overhead Thai street-food photo, steamed jasmine rice with spicy minced pork holy-basil stir-fry (pad kaphrao), crispy-edged fried egg on top, on white ceramic plate, school canteen table, natural daylight, appetizing, no hands, no text' },
  'curry-rice': { label: 'ข้าวแกง', file: 'curry-rice.jpg', from: '#E8F5E9', to: '#66BB6A',
    prompt: 'Overhead Thai curry rice photo, jasmine rice with green curry chicken in small bowl, Thai omelette strip, on banana-leaf lined tray, canteen style, daylight, appetizing, no text' },
  'omelette': { label: 'ไข่เจียว', file: 'omelette.jpg', from: '#FFF8E1', to: '#FFD54F',
    prompt: 'Thai-style crispy fluffy pork omelette (khai jiao) over jasmine rice, fish sauce with chilies on side, white plate, canteen table, daylight, close-up, no text' },
  'fried-rice': { label: 'ข้าวผัด', file: 'fried-rice.jpg', from: '#FFF3E0', to: '#FFA726',
    prompt: 'Thai shrimp fried rice (khao pad goong) with large prawns, cucumber and lime wedge, white plate, overhead canteen photo, daylight, appetizing, no text' },
  'boat-noodle': { label: 'ก๋วยเตี๋ยวเรือ', file: 'boat-noodle.jpg', from: '#EFEBE9', to: '#8D6E63',
    prompt: 'Thai boat noodles (kuay teow ruea) small bowl, dark concentrated pork broth, rice noodles, sliced pork, pork ball, morning glory, fried garlic, on wooden canteen table, steam, overhead, no text' },
  'dry-noodle': { label: 'บะหมี่แห้ง', file: 'dry-noodle.jpg', from: '#FFF8E1', to: '#FFB300',
    prompt: 'Thai dry egg noodles (bami haeng) with BBQ red pork slices, wontons, bok choy, crushed peanut, white bowl, overhead canteen photo, daylight, no text' },
  'pink-noodle': { label: 'เย็นตาโฟ', file: 'pink-noodle.jpg', from: '#FCE4EC', to: '#F06292',
    prompt: 'Thai yen ta fo pink noodle soup, translucent pink broth, fish balls, squid, morning glory, fried wonton crisp, white bowl, overhead, steam, daylight, no text' },
  'rad-na': { label: 'ราดหน้า/ผัดซีอิ๊ว', file: 'rad-na.jpg', from: '#FFFDE7', to: '#D7CCC8',
    prompt: 'Thai rad-na crispy egg noodles with pork gravy sauce and kale, flat rice-noodle pad see ew variant beside, white plate, canteen table, overhead, daylight, no text' },
  'fried-chicken': { label: 'ไก่ทอดหาดใหญ่', file: 'fried-chicken.jpg', from: '#FFF3E0', to: '#E65100',
    prompt: 'Hat Yai Thai fried chicken, golden crispy drumsticks with crispy fried shallots on top, sticky rice in plastic bag beside, banana leaf tray, canteen style, daylight, no text' },
  'biryani': { label: 'ข้าวหมกไก่', file: 'biryani.jpg', from: '#FFF8E1', to: '#FF8F00',
    prompt: 'Thai chicken biryani (khao mok gai) yellow turmeric rice with fried chicken leg, pickled green chili sauce, sliced cucumber, white plate, overhead canteen photo, no text' },
  'sticky-chicken': { label: 'ข้าวเหนียวไก่ทอด', file: 'sticky-chicken.jpg', from: '#F3E5F5', to: '#AB47BC',
    prompt: 'Thai sticky rice with crispy fried chicken in paper bag, sweet chili sauce cup, banana leaf, school canteen table, overhead daylight photo, no text' },
  'bubble-tea': { label: 'ชานมไข่มุก', file: 'bubble-tea.jpg', from: '#F3E5F5', to: '#8D6E63',
    prompt: 'Taiwanese brown-sugar bubble milk tea in clear plastic cup, black tapioca pearls, tiger stripes, dome lid, pastel pink canteen background, product photo, no text' },
  'matcha': { label: 'มัทฉะลาเต้', file: 'matcha.jpg', from: '#E8F5E9', to: '#2E7D32',
    prompt: 'Iced matcha latte layered green tea and fresh milk in tall plastic cup, school drink-stall background, product photo, daylight, no text' },
  'cocoa': { label: 'โกโก้เย็น', file: 'cocoa.jpg', from: '#EFEBE9', to: '#4E342E',
    prompt: 'Iced cocoa with whipped cream in tall plastic cup, chocolate drizzle, dark brown drink, canteen drink stall background, product photo, no text' },
  'toast': { label: 'ขนมปังปิ้ง', file: 'toast.jpg', from: '#FFF8E1', to: '#A1887F',
    prompt: 'Thai grilled toast with pandan custard (sangkhaya) dip, golden toasted white bread triangles on paper tray, canteen stall photo, daylight, no text' },
  'shaved-ice': { label: 'ปังเย็น/น้ำแข็งไส', file: 'shaved-ice.jpg', from: '#E3F2FD', to: '#42A5F5',
    prompt: 'Thai shaved-ice dessert (pang yen cha thai) orange Thai-tea shaved ice with whipped cream and condensed milk in plastic cup, long spoon, canteen stall, daylight, no text' },
  'soup': { label: 'ต้มจืด/ซุป', file: 'soup.jpg', from: '#E8F5E9', to: '#80CBC4',
    prompt: 'Thai clear pork soup with egg tofu and seaweed (tom chued) in white bowl with spoon, steam, canteen table, daylight overhead photo, no text' },
  'veg-side': { label: 'น้ำพริกผักสด', file: 'veg-side.jpg', from: '#E8F5E9', to: '#558B2F',
    prompt: 'Thai shrimp-paste chili dip (nam phrik kapi) small bowl with fresh raw vegetables, cucumber long beans cabbage, banana-leaf tray, canteen photo, daylight, no text' },
  'dumpling': { label: 'เกี๊ยวกรอบ', file: 'dumpling.jpg', from: '#FFF8E1', to: '#FF6F00',
    prompt: 'Deep-fried crispy pork wontons (kiew krob) golden puffs with sweet plum sauce dip, white plate, canteen table, close-up daylight, no text' },
  'fried-egg': { label: 'ไข่ดาว', file: 'fried-egg.jpg', from: '#FFFDE7', to: '#FFB300',
    prompt: 'Crispy-edged Thai fried egg sunny side up on small white plate, fish sauce with chilies beside, extreme close-up canteen photo, daylight, no text' },
  'suki': { label: 'สุกี้', file: 'suki.jpg', from: '#FFEBEE', to: '#EF5350',
    prompt: 'Thai dry suki (sukiyaki haeng) glass noodles with seafood shrimp squid, morning glory, suki dipping sauce cup, white plate, canteen photo, daylight, no text' },
  'bowl': { label: 'อาหารทั่วไป', file: 'bowl.jpg', from: '#F5F5F5', to: '#BDBDBD',
    prompt: 'Simple Thai rice-and-curry canteen set on stainless tray, rice bowl plus two side dishes, overhead school canteen photo, daylight, appetizing, no text' },
}

export function foodKindFor(name = '', category = ''): FoodKind {
  const t = `${name} ${category}`
  const has = (...ks: string[]) => ks.some((k) => t.includes(k))
  if (has('กะเพรา')) return 'kaphrao'
  if (has('เขียวหวาน', 'แกงส้ม', 'แกง', 'ข้าวราดแกง')) return 'curry-rice'
  if (has('ไข่เจียว')) return 'omelette'
  if (has('ข้าวผัด')) return 'fried-rice'
  if (has('เย็นตาโฟ')) return 'pink-noodle'
  if (has('บะหมี่แห้ง', 'บะหมี่', 'หมูแดง')) return 'dry-noodle'
  if (has('เรือ', 'น้ำตก')) return 'boat-noodle'
  if (has('ราดหน้า', 'ผัดซีอิ๊ว', 'ผัด')) return 'rad-na'
  if (has('ข้าวหมก', 'หมกไก่')) return 'biryani'
  if (has('ข้าวเหนียว')) return 'sticky-chicken'
  if (has('ไก่ทอด', 'หาดใหญ่')) return 'fried-chicken'
  if (has('บราวน์', 'ไข่มุก', 'ชานม', 'ชาไทย') && !has('ปังเย็น', 'น้ำแข็งไส')) return 'bubble-tea'
  if (has('มัทฉะ', 'ชาเขียว')) return 'matcha'
  if (has('โกโก้')) return 'cocoa'
  if (has('ปังเย็น', 'น้ำแข็งไส')) return 'shaved-ice'
  if (has('ปังปิ้ง', 'สังขยา', 'ขนมปัง')) return 'toast'
  if (has('ต้มจืด', 'ต้ม', 'ซุป', 'แกงจืด')) return 'soup'
  if (has('น้ำพริก', 'ผักสด', 'เครื่องเคียง')) return 'veg-side'
  if (has('เกี๊ยว')) return 'dumpling'
  if (has('ไข่ดาว')) return 'fried-egg'
  if (has('สุกี้')) return 'suki'
  if (has('หอมเจียว')) return 'veg-side'
  if (has('ชา', 'นม', 'น้ำ', 'เครื่องดื่ม', 'โกโก้')) return t.includes('เขียว') ? 'matcha' : 'bubble-tea'
  if (has('ขนม', 'หวาน', 'ของทานเล่น', 'ทอด')) return 'dumpling'
  if (has('ข้าว')) return 'kaphrao'
  if (has('ก๋วยเตี๋ยว', 'เส้น', 'หมี่')) return 'boat-noodle'
  if (has('ไก่')) return 'fried-chicken'
  return 'bowl'
}

export function storeKindFor(storeName = ''): FoodKind {
  if (storeName.includes('ข้าวแกง') || storeName.includes('ป้าอ้วน')) return 'curry-rice'
  if (storeName.includes('ก๋วยเตี๋ยว') || storeName.includes('เรือ')) return 'boat-noodle'
  if (storeName.includes('ไก่ทอด') || storeName.includes('บังยี')) return 'fried-chicken'
  if (storeName.includes('ชานม') || storeName.includes('Chill')) return 'bubble-tea'
  if (storeName.includes('ตามสั่ง') || storeName.includes('คุณแม่')) return 'kaphrao'
  return 'bowl'
}

/** Full audit table: what was wrong + what replaces it. Used by docs/tests. */
export const IMAGE_AUDIT: { name: string; oldId: string; problem: string; kind: FoodKind }[] = [
  { name: 'ก๋วยเตี๋ยวเรือหมู น้ำตก', oldId: '1569718212165-3a8278d5f624', problem: 'Japanese ramen, not Thai boat-noodle dark broth', kind: 'boat-noodle' },
  { name: 'บะหมี่แห้งหมูแดง', oldId: '1552611052-33e04de081de', problem: 'Generic noodle plate, no red BBQ pork / wonton cues', kind: 'dry-noodle' },
  { name: 'เย็นตาโฟ', oldId: '1563379091339-03b21ab4a4f8', problem: 'Stir-fried noodles, but yen-ta-fo must be PINK soup', kind: 'pink-noodle' },
  { name: 'ข้าวผัดกุ้ง', oldId: '1512058564366-18510be2db19', problem: 'Chinese takeout style, no Thai prawn/lime/cucumber cues', kind: 'fried-rice' },
  { name: 'ปังเย็นชาไทย', oldId: '1563805042-7684c019e1cb', problem: 'Western sundae glass, not Thai-tea shaved ice cup', kind: 'shaved-ice' },
  { name: 'หอมเจียว', oldId: '1596040033229-a9821ebd058d', problem: 'Spice-market jars, not a crispy-shallot side portion', kind: 'veg-side' },
  { name: 'ราดหน้าหมี่กรอบ', oldId: '1563245372-f21724e3856d', problem: 'Wrong noodle/gravy look for rad-na', kind: 'rad-na' },
  { name: 'ร้านก๋วยเตี๋ยวเรือสยาม (cover)', oldId: '1555396273-367ea4eb4db5', problem: 'Western fine-dining spread, not a noodle-boat stall', kind: 'boat-noodle' },
  { name: 'ร้านชานม Chill Bar (cover)', oldId: '1558857563-b371033873b8', problem: 'Generic dessert table, not a bubble-tea stall', kind: 'bubble-tea' },
  { name: 'หมวดข้าว (tile)', oldId: '1512058564366-18510be2db19', problem: 'Reused fried-rice stock for whole category', kind: 'kaphrao' },
  { name: 'หมวดก๋วยเตี๋ยว (tile)', oldId: '1569718212165-3a8278d5f624', problem: 'Japanese ramen for Thai noodles', kind: 'boat-noodle' },
  { name: 'หมวดของหวาน (tile)', oldId: '1563805042-7684c019e1cb', problem: 'Western sundae for Thai toast/shaved-ice', kind: 'shaved-ice' },
]
