const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project_green',
});

async function seed() {
  await client.connect();

  // 1. สร้าง Organization ก่อน
  const orgResult = await client.query(`
    INSERT INTO organizations (name, tax_id, industry_type, number_of_employees, total_floor_area, working_hours_per_year, target_reduction_percent)
    VALUES ('Admin Organization', '0000000000000', 'Government', 0, 0, 0, 0)
    RETURNING org_id
  `);
  const orgId = orgResult.rows[0].org_id;

  // 2. Hash password
  const hash = await bcrypt.hash('admin123', 10);

  // 3. สร้าง Admin user
  await client.query(`
    INSERT INTO users (email, password_hash, is_active, org_id)
    VALUES ('Admin@testmail.com', $1, true, $2)
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, is_active = true, org_id = $2
  `, [hash, orgId]);

  console.log('✅ สร้างสำเร็จ!');
  console.log('   Email   : Admin@testmail.com');
  console.log('   Password: admin123');
  console.log('   Note    : บัญชีนี้ถูกสร้างในตาราง users (role ใน JWT/ระบบสิทธิ์อาจถูกกำหนดจากระบบอื่น)');

  await client.end();
}

seed().catch(e => { console.error('Error:', e.message); process.exit(1); });
