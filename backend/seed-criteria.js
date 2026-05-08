const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project_green',
});

const criteria = [
  { category: 1, code: '1.1', name: 'การกำหนดนโยบายสิ่งแวดล้อม', max: 5, desc: 'มีนโยบายสิ่งแวดล้อมที่ครอบคลุมและสื่อสารให้พนักงานทราบ' },
  { category: 1, code: '1.2', name: 'คณะทำงานและการทบทวนฝ่ายบริหาร', max: 5, desc: 'มีการแต่งตั้งคณะทำงานและประชุมทบทวนอย่างน้อยปีละ 1 ครั้ง' },
  { category: 2, code: '2.1', name: 'การสื่อสารและอบรมพนักงาน', max: 5, desc: 'มีการอบรมพนักงานเรื่องสำนักงานสีเขียวอย่างน้อย 80%' },
  { category: 3, code: '3.1', name: 'การจัดการพลังงาน (ไฟฟ้า)', max: 5, desc: 'มีมาตรการลดการใช้ไฟฟ้าและผลประเมินผ่านเกณฑ์' },
  { category: 3, code: '3.2', name: 'การจัดการทรัพยากร (น้ำ/กระดาษ)', max: 5, desc: 'มีมาตรการลดการใช้น้ำและกระดาษอย่างเป็นรูปธรรม' },
  { category: 4, code: '4.1', name: 'การจัดการของเสีย', max: 5, desc: 'มีการคัดแยกขยะอย่างถูกต้องและมีจุดทิ้งขยะที่เหมาะสม' },
  { category: 5, code: '5.1', name: 'สภาพแวดล้อมและความปลอดภัย', max: 5, desc: 'แสงสว่าง กลิ่น อากาศ และความปลอดภัยได้มาตรฐาน' },
  { category: 6, code: '6.1', name: 'การจัดซื้อจัดจ้างที่เป็นมิตรกับสิ่งแวดล้อม', max: 5, desc: 'มีสัดส่วนการจัดซื้อสินค้าฉลากเขียวไม่น้อยกว่า 30%' }
];

async function seed() {
  await client.connect();
  
  console.log('Clearing existing criteria...');
  await client.query("DELETE FROM green_criteria_master");
  
  console.log('Inserting mock Green Office criteria...');
  
  for (const c of criteria) {
    await client.query(
      "INSERT INTO green_criteria_master (category_number, criteria_code, criteria_name, max_score, description, year_version) VALUES ($1, $2, $3, $4, $5, 2024)",
      [c.category, c.code, c.name, c.max, c.desc]
    );
  }

  console.log('Mock criteria inserted successfully!');
  await client.end();
}

seed().catch(err => {
  console.error('Error inserting criteria data:', err);
  process.exit(1);
});
