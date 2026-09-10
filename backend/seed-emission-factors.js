const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project-green',
});

const emissionFactors = [
  { name: 'น้ำมันดีเซล (Diesel)', scope: 1, unit: 'Liter', factor_value: 2.7446 },
  { name: 'น้ำมันเบนซิน (Gasoline)', scope: 1, unit: 'Liter', factor_value: 2.1887 },
  { name: 'น้ำมันแก๊สโซฮอล์ 95 (Gasohol 95)', scope: 1, unit: 'Liter', factor_value: 2.1558 },
  { name: 'น้ำมันแก๊สโซฮอล์ 91 (Gasohol 91)', scope: 1, unit: 'Liter', factor_value: 2.1384 },
  { name: 'น้ำมันแก๊สโซฮอล์ E20 (Gasohol E20)', scope: 1, unit: 'Liter', factor_value: 1.7061 },
  { name: 'ก๊าซหุงต้ม (LPG)', scope: 1, unit: 'kg', factor_value: 3.1114 },
  { name: 'สารทำความเย็น R-32', scope: 1, unit: 'kg', factor_value: 675 },
  { name: 'สารทำความเย็น R-410a', scope: 1, unit: 'kg', factor_value: 2088 },
  { name: 'สารทำความเย็น R-22', scope: 1, unit: 'kg', factor_value: 1760 },
  { name: 'ถังดับเพลิง CO2', scope: 1, unit: 'kg', factor_value: 1 },
  { name: 'พลังงานไฟฟ้า (Grid Mix)', scope: 2, unit: 'kWh', factor_value: 0.4999 },
  { name: 'น้ำประปา', scope: 3, unit: 'm3', factor_value: 0.2642 },
  { name: 'กระดาษ', scope: 3, unit: 'kg', factor_value: 0.941 },
  { name: 'ขยะทั่วไป (ส่งฝังกลบ - Landfill)', scope: 3, unit: 'kg', factor_value: 0.835 },
  { name: 'น้ำเสีย (ระบบไม่เติมอากาศ)', scope: 3, unit: 'm3', factor_value: 0.528 },
];

async function seed() {
  await client.connect();
  
  console.log('Clearing existing emission factors...');
  await client.query("DELETE FROM emission_factors");
  
  console.log('Inserting mock Emission Factors...');
  
  for (const ef of emissionFactors) {
    await client.query(
      "INSERT INTO emission_factors (name, scope, unit, factor_value, year, source) VALUES ($1, $2, $3, $4, 2026, '2569 TGO')",
      [ef.name, ef.scope, ef.unit, ef.factor_value]
    );
  }

  console.log('Emission Factors inserted successfully!');
  await client.end();
}

seed().catch(err => {
  console.error('Error inserting emission factors:', err);
  process.exit(1);
});
