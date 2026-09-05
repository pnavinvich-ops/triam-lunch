import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import crypto from 'crypto';
const url = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env','utf8').match(/SUPABASE_URL=(.+)/)[1].trim();
const svc = fs.readFileSync('C:/Users/Porsche.Porsche-NB/Coding/ArmLog App Opencode/bolt.app/.env','utf8').match(/SUPABASE_SERVICE_KEY=(.+)/)[1].trim();
const sb = createClient(url, svc);
const hashPin = (pin) => crypto.createHash('sha256').update(pin).digest('hex');
const del = await sb.from('lunch_stores').delete().in('id',['259141e1-4c54-45ea-a0b9-aa5faeabb03b','04cf4abc-9aec-425a-8236-570f47118063']);
console.log('deleted', del.error||'ok');
await sb.from('lunch_stores').update({ name:'ร้านข้าวแกงป้าอ้วน', description:'ข้าวราดแกง 4 อย่าง กับข้าวใหม่ทุกวัน เริ่มต้น 35 บาท', location:'โรงอาหารกลาง แถว A ล็อก 3', image_url:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80&auto=format&fit=crop' }).eq('id','8b1593cb-5ebd-404c-b4a6-c96436976417');
console.log('updated pa auan');
const stores = [
  {name:'ก๋วยเตี๋ยวเรือสยาม', description:'ก๋วยเตี๋ยวเรือเข้มข้น เส้นเหนียวนุ่ม น้ำซุปหอมเครื่องเทศ', location:'โรงอาหารกลาง แถว B ล็อก 1', image_url:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80&auto=format&fit=crop', pin_hash: hashPin('1111')},
  {name:'ไก่ทอดหาดใหญ่ บังยี', description:'ไก่ทอดกรอบนอกนุ่มใน หอมเจียวกรอบ สูตรหาดใหญ่แท้', location:'โรงอาหารกลาง แถว A ล็อก 7', image_url:'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&q=80&auto=format&fit=crop', pin_hash: hashPin('2222')},
  {name:'ชานมไข่มุก Chill Bar', description:'ชานมไต้หวัน ชาเขียวมัทฉะ ผลไม้ปั่น ขนมปังปิ้ง', location:'โรงอาหารกลาง หน้าทางเข้า', image_url:'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&q=80&auto=format&fit=crop', pin_hash: hashPin('3333')},
  {name:'ครัวคุณแม่ — อาหารตามสั่ง', description:'ผัดกะเพรา ข้าวผัด ผัดซีอิ๊ว ราดหน้า ทำใหม่จานต่อจาน', location:'โรงอาหารกลาง แถว C ล็อก 2', image_url:'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&q=80&auto=format&fit=crop', pin_hash: hashPin('4444')},
];
for(const s of stores){ const {data,error}=await sb.from('lunch_stores').insert(s).select().single(); console.log(s.name, error?error.message:data.id); }
const {data:all}=await sb.from('lunch_stores').select('id,name'); console.log(all.map(s=>s.name));
