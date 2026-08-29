import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const url = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env','utf8').match(/SUPABASE_URL=(.+)/)[1].trim();
const svc = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env','utf8').match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const sb = createClient(url, svc);
const {data:stores}=await sb.from('lunch_stores').select('id,name');
const byName=Object.fromEntries(stores.map(s=>[s.name,s.id]));
// wipe old menu items for pa auan and reseed all
await sb.from('lunch_menu_items').delete().eq('store_id','8b1593cb-5ebd-404c-b4a6-c96436976417');
console.log('wiped old items');

const menu = {
 'ร้านข้าวแกงป้าอ้วน': [
   {name:'ข้าวกะเพราหมูสับ + ไข่ดาว', price_thb:45, category:'ข้าวราดแกง', description:'หมูสับผัดใบกะเพราหอมพริกแห้ง เสิร์ฟกับไข่ดาวกรอบขอบ', image_url:'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80&auto=format&fit=crop'},
   {name:'ข้าวแกงเขียวหวานไก่', price_thb:45, category:'ข้าวราดแกง', description:'แกงเขียวหวานไก่ มะเขือเปราะ กะทิข้นหอมเครื่องแกง', image_url:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80&auto=format&fit=crop'},
   {name:'ข้าวแกงส้มชะอมกุ้ง', price_thb:45, category:'ข้าวราดแกง', description:'แกงส้มรสจัดจ้าน ใส่ชะอมทอดและกุ้งสด', image_url:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80&auto=format&fit=crop'},
   {name:'ข้าวไข่เจียวหมูสับ', price_thb:35, category:'ข้าวราดแกง', description:'ไข่เจียวฟูกรอบ ใส่หมูสับ หอมเจียว', image_url:'https://images.unsplash.com/photo-1482049016688-2d3e1b31122d?w=400&q=80&auto=format&fit=crop'},
   {name:'น้ำพริกกะปิ + ผักสด', price_thb:30, category:'เครื่องเคียง', description:'น้ำพริกกะปิรสแซ่บ ผักสดปลอดสาร', image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80&auto=format&fit=crop'},
   {name:'ต้มจืดเต้าหู้หมูสับ', price_thb:30, category:'ซุป', description:'ซุปร้อนๆ เต้าหู้ไข่ สาหร่าย หมูสับ', image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80&auto=format&fit=crop'},
 ],
 'ก๋วยเตี๋ยวเรือสยาม': [
   {name:'ก๋วยเตี๋ยวเรือหมู น้ำตก', price_thb:45, category:'ก๋วยเตี๋ยวเรือ', description:'เส้นเล็กเหนียวนุ่ม น้ำตกข้นหอมเลือดหมู', image_url:'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80&auto=format&fit=crop'},
   {name:'ก๋วยเตี๋ยวเรือเนื้อ น้ำตก', price_thb:55, category:'ก๋วยเตี๋ยวเรือ', description:'เนื้อเปื่อยนุ่ม ลูกชิ้นเนื้อ น้ำซุปเข้มข้น', image_url:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80&auto=format&fit=crop'},
   {name:'บะหมี่แห้งหมูแดง', price_thb:45, category:'บะหมี่', description:'บะหมี่ไข่เหนียวนุ่ม หมูแดงย่างถ่าน', image_url:'https://images.unsplash.com/photo-1552611052-33e04de081de?w=400&q=80&auto=format&fit=crop'},
   {name:'เย็นตาโฟ', price_thb:45, category:'ก๋วยเตี๋ยว', description:'น้ำซอสเย็นตาโฟชมพู ลูกชิ้นปลา', image_url:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80&auto=format&fit=crop'},
   {name:'เกี๊ยวกรอบ', price_thb:20, category:'ของทานเล่น', description:'เกี๊ยวหมูทอดกรอบ 3 ชิ้น', image_url:'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=400&q=80&auto=format&fit=crop'},
 ],
 'ไก่ทอดหาดใหญ่ บังยี': [
   {name:'ข้าวหมกไก่', price_thb:50, category:'ข้าวหมก', description:'ข้าวหมกหอมเครื่องเทศ ไก่ทอดหาดใหญ่', image_url:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80&auto=format&fit=crop'},
   {name:'ไก่ทอดหาดใหญ่ (2 ชิ้น)', price_thb:40, category:'ไก่ทอด', description:'ไก่ทอดกรอบนอกนุ่มใน หอมเจียว', image_url:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80&auto=format&fit=crop'},
   {name:'ข้าวเหนียวไก่ทอด', price_thb:35, category:'ข้าวเหนียว', description:'ข้าวเหนียวร้อนๆ กับไก่ทอดชิ้นใหญ่', image_url:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80&auto=format&fit=crop'},
   {name:'ซุปไก่', price_thb:30, category:'ซุป', description:'ซุปไก่มันฝรั่ง หอมพริกไทย', image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80&auto=format&fit=crop'},
   {name:'หอมเจียว', price_thb:10, category:'เครื่องเคียง', description:'หอมเจียวกรอบๆ เพิ่มความหอม', image_url:'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=400&q=80&auto=format&fit=crop'},
 ],
 'ชานมไข่มุก Chill Bar': [
   {name:'ชานมไข่มุกบราวน์ชูการ์', price_thb:35, category:'ชานม', description:'ชานมไต้หวัน ไข่มุกหนึบ ซอสน้ำตาลทรายแดง', image_url:'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80&auto=format&fit=crop'},
   {name:'ชาเขียวมัทฉะลาเต้', price_thb:40, category:'ชาเขียว', description:'มัทฉะแท้จากญี่ปุ่น นมสด', image_url:'https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&q=80&auto=format&fit=crop'},
   {name:'โกโก้เย็น', price_thb:30, category:'โกโก้', description:'โกโก้เข้มข้น หวานมัน', image_url:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80&auto=format&fit=crop'},
   {name:'ขนมปังปิ้งสังขยา', price_thb:25, category:'ขนมปัง', description:'ขนมปังปิ้งกรอบนอกนุ่มใน สังขยาใบเตย', image_url:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80&auto=format&fit=crop'},
   {name:'ปังเย็นชาไทย', price_thb:35, category:'ขนมหวาน', description:'น้ำแข็งไสชาไทย วิปครีม', image_url:'https://images.unsplash.com/photo-1488477181946-64290103bb53?w=400&q=80&auto=format&fit=crop'},
 ],
 'ครัวคุณแม่ — อาหารตามสั่ง': [
   {name:'ข้าวผัดกะเพราหมูกรอบ', price_thb:50, category:'ตามสั่ง', description:'หมูกรอบชิ้นใหญ่ ผัดกะเพราเผ็ดร้อน', image_url:'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80&auto=format&fit=crop'},
   {name:'ข้าวผัดกุ้ง', price_thb:50, category:'ตามสั่ง', description:'ข้าวผัดหอมกระทะ กุ้งตัวใหญ่', image_url:'https://images.unsplash.com/photo-1603133872875-ca2a98a0a862?w=400&q=80&auto=format&fit=crop'},
   {name:'ราดหน้าหมี่กรอบ', price_thb:45, category:'ราดหน้า', description:'หมี่กรอบราดน้ำเหนียวข้น หมูหมัก', image_url:'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80&auto=format&fit=crop'},
   {name:'ผัดซีอิ๊ว', price_thb:45, category:'ผัด', description:'เส้นใหญ่ผัดซีอิ๊ว คะน้า หมู', image_url:'https://images.unsplash.com/photo-1552611052-33e04de081de?w=400&q=80&auto=format&fit=crop'},
   {name:'สุกี้แห้งทะเล', price_thb:50, category:'สุกี้', description:'วุ้นเส้น ผักรวม ทะเล น้ำจิ้มสุกี้', image_url:'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80&auto=format&fit=crop'},
   {name:'ไข่ดาวเพิ่ม', price_thb:10, category:'เพิ่ม', description:'ไข่ดาวกรอบขอบ', image_url:'https://images.unsplash.com/photo-1482049016688-2d3e1b31122d?w=400&q=80&auto=format&fit=crop'},
 ],
};
for(const [storeName, items] of Object.entries(menu)){
  const sid=byName[storeName];
  for(const it of items){
    const {error}=await sb.from('lunch_menu_items').insert({store_id:sid, ...it});
    if(error) console.log('err', storeName, it.name, error.message);
  }
  console.log('seeded', storeName, items.length);
}
const {count}=await sb.from('lunch_menu_items').select('*',{count:'exact', head:true});
console.log('total items', count);
