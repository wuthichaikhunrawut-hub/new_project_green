const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project_green',
});

const emissionFactors = [
  { category: 'Fuel', type_name: 'น้ำมันดีเซล (Diesel)', unit: 'Liter', factor_value: 2.7446 },
  { category: 'Fuel', type_name: 'น้ำมันเบนซิน (Gasoline)', unit: 'Liter', factor_value: 2.1887 },
  { category: 'Fuel', type_name: 'น้ำมันแก๊สโซฮอล์ 95 (Gasohol 95)', unit: 'Liter', factor_value: 2.1558 },
  { category: 'Fuel', type_name: 'น้ำมันแก๊สโซฮอล์ 91 (Gasohol 91)', unit: 'Liter', factor_value: 2.1384 },
  { category: 'Fuel', type_name: 'น้ำมันแก๊สโซฮอล์ E20 (Gasohol E20)', unit: 'Liter', factor_value: 1.7061 },
  { category: 'Fuel', type_name: 'ก๊าซหุงต้ม (LPG)', unit: 'kg', factor_value: 3.1114 },
  { category: 'Refrigerants', type_name: 'สารทำความเย็น R-32', unit: 'kg', factor_value: 675 },
  { category: 'Refrigerants', type_name: 'สารทำความเย็น R-410a', unit: 'kg', factor_value: 2088 },
  { category: 'Refrigerants', type_name: 'สารทำความเย็น R-22', unit: 'kg', factor_value: 1760 },
  { category: 'Fire Extinguishers', type_name: 'ถังดับเพลิง CO2', unit: 'kg', factor_value: 1 },
  { category: 'Electricity', type_name: 'พลังงานไฟฟ้า (Grid Mix)', unit: 'kWh', factor_value: 0.4999 },
  { category: 'Water', type_name: 'น้ำประปา', unit: 'm3', factor_value: 0.2642 },
  { category: 'Office Supplies', type_name: 'กระดาษ', unit: 'kg', factor_value: 0.941 },
  { category: 'Waste', type_name: 'ขยะทั่วไป (ส่งฝังกลบ - Landfill)', unit: 'kg', factor_value: 0.835 },
  { category: 'Wastewater', type_name: 'น้ำเสีย (ระบบไม่เติมอากาศ)', unit: 'm3', factor_value: 0.528 },
];

async function seed() {
  await client.connect();
  
  console.log('Clearing existing emission factors...');
  await client.query("DELETE FROM emission_factors");
  
  console.log('Inserting mock Emission Factors...');
  
  for (const ef of emissionFactors) {
    await client.query(
      "INSERT INTO emission_factors (id, category, type_name, unit, factor_value, gwp_version, is_active) VALUES (gen_random_uuid(), $1, $2, $3, $4, '2569 TGO', true)",
      [ef.category, ef.type_name, ef.unit, ef.factor_value]
    );
  }

  console.log('Emission Factors inserted successfully!');
  await client.end();
}

seed().catch(err => {
  console.error('Error inserting emission factors:', err);
  process.exit(1);
});
