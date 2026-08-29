import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const url = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env','utf8').match(/SUPABASE_URL=(.+)/)[1].trim();
const svc = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env','utf8').match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const sb = createClient(url, svc);

// correct, distinct, keyword-matched images via loremflickr (Flickr search = actually matches dish)
const fixes = {
 'ข้าวกะเพราหมูสับ + ไข่ดาว': 'https://loremflickr.com/400/400/basil,stir-fry,rice?lock=11',
 'ข้าวแกงเขียวหวานไก่': 'https://loremflickr.com/400/400/green-curry,thai?lock=12',
 'ข้าวแกงส้มชะอมกุ้ง': 'https://loremflickr.com/400/400/sour-soup,shrimp?lock=13',
 'ข้าวไข่เจียวหมูสับ': 'https://loremflickr.com/400/400/omelette,egg?lock=14',
 'น้ำพริกกะปิ + ผักสด': 'https://loremflickr.com/400/400/chili-paste,vegetables?lock=15',
 'ต้มจืดเต้าหู้หมูสับ': 'https://loremflickr.com/400/400/clear-soup,tofu?lock=16',
 'ก๋วยเตี๋ยวเรือหมู น้ำตก': 'https://loremflickr.com/400/400/boat-noodles,thai?lock=21',
 'ก๋วยเตี๋ยวเรือเนื้อ น้ำตก': 'https://loremflickr.com/400/400/beef-noodles,thai?lock=22',
 'บะหมี่แห้งหมูแดง': 'https://loremflickr.com/400/400/wonton-noodles,pork?lock=23',
 'เย็นตาโฟ': 'https://loremflickr.com/400/400/pink-noodles,fishball?lock=24',
 'เกี๊ยวกรอบ': 'https://loremflickr.com/400/400/fried-wonton?lock=25',
 'ข้าวหมกไก่': 'https://loremflickr.com/400/400/biryani,chicken?lock=31',
 'ไก่ทอดหาดใหญ่ (2 ชิ้น)': 'https://loremflickr.com/400/400/fried-chicken?lock=32',
 'ข้าวเหนียวไก่ทอด': 'https://loremflickr.com/400/400/sticky-rice,chicken?lock=33',
 'ซุปไก่': 'https://loremflickr.com/400/400/chicken-soup?lock=34',
 'หอมเจียว': 'https://loremflickr.com/400/400/fried-shallots?lock=35',
 'ชานมไข่มุกบราวน์ชูการ์': 'https://loremflickr.com/400/400/bubble-tea,boba?lock=41',
 'ชาเขียวมัทฉะลาเต้': 'https://loremflickr.com/400/400/matcha,latte?lock=42',
 'โกโก้เย็น': 'https://loremflickr.com/400/400/iced-cocoa?lock=43',
 'ขนมปังปิ้งสังขยา': 'https://loremflickr.com/400/400/toast,kaya?lock=44',
 'ปังเย็นชาไทย': 'https://loremflickr.com/400/400/thai-tea,shaved-ice?lock=45',
 'ข้าวผัดกะเพราหมูกรอบ': 'https://loremflickr.com/400/400/crispy-pork,basil?lock=51',
 'ข้าวผัดกุ้ง': 'https://loremflickr.com/400/400/fried-rice,shrimp?lock=52',
 'ราดหน้าหมี่กรอบ': 'https://loremflickr.com/400/400/crispy-noodles,gravy?lock=53',
 'ผัดซีอิ๊ว': 'https://loremflickr.com/400/400/pad-see-ew?lock=54',
 'สุกี้แห้งทะเล': 'https://loremflickr.com/400/400/suki,seafood?lock=55',
 'ไข่ดาวเพิ่ม': 'https://loremflickr.com/400/400/fried-egg?lock=56',
};
let ok=0;
for(const [name,url2] of Object.entries(fixes)){
  const {error, count} = await sb.from('lunch_menu_items').update({image_url: url2}).eq('name', name);
  if(error) console.log('ERR',name,error.message); else ok++;
}
console.log('updated',ok);

// also fix store covers to match store type (distinct)
const storeFixes={
 'ร้านข้าวแกงป้าอ้วน': 'https://loremflickr.com/400/400/thai-curry,rice?lock=101',
 'ก๋วยเตี๋ยวเรือสยาม': 'https://loremflickr.com/400/400/boat-noodles,thai?lock=102',
 'ไก่ทอดหาดใหญ่ บังยี': 'https://loremflickr.com/400/400/fried-chicken,hat-yai?lock=103',
 'ชานมไข่มุก Chill Bar': 'https://loremflickr.com/400/400/bubble-tea,cafe?lock=104',
 'ครัวคุณแม่ — อาหารตามสั่ง': 'https://loremflickr.com/400/400/wok,stir-fry?lock=105',
};
for(const [n,u] of Object.entries(storeFixes)){
  await sb.from('lunch_stores').update({image_url:u}).eq('name',n);
}
console.log('store covers fixed');

const {data}=await sb.from('lunch_menu_items').select('name,image_url').limit(3);
console.log(data[0]);
