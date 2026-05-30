const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'greenoffice',
});

async function seed() {
  await client.connect();

  console.log('🌱 Starting Assessor Admin seeding...');

  // 1. Ensure "Assessor Admin" role exists
  const roleName = 'Assessor Admin';
  const roleRes = await client.query(`
    INSERT INTO roles (role_name)
    VALUES ($1)
    ON CONFLICT (role_name) DO UPDATE SET role_name = $1
    RETURNING role_id
  `, [roleName]);
  const roleId = roleRes.rows[0].role_id;
  console.log(`✅ Role "Assessor Admin" verified. ID: ${roleId}`);

  // 2. Hash password
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  // 3. Create/Update user in users table
  const email = 'sivimon@testmail.com';
  const userRes = await client.query(`
    INSERT INTO users (email, password_hash, is_active)
    VALUES ($1, $2, true)
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = true
    RETURNING user_id
  `, [email, hash]);
  const userId = userRes.rows[0].user_id;
  console.log(`✅ User account verified. ID: ${userId}`);

  // 4. Create/Update user_profile
  await client.query(`
    INSERT INTO user_profiles (user_id, first_name, last_name, phone)
    VALUES ($1, 'ศิวิมล', 'มาลักษณ์', '0899999999')
    ON CONFLICT (user_id) DO UPDATE SET first_name = 'ศิวิมล', last_name = 'มาลักษณ์', phone = '0899999999'
  `, [userId]);
  console.log('✅ User profile set to "ศิวิมล มาลักษณ์".');

  // 5. Create/Update assessor_profile
  await client.query(`
    INSERT INTO assessor_profiles (user_id, license_number, years_experience, education_background, verification_status, verified_at)
    VALUES ($1, 'ASM-9999', 5, 'ปร.ด. สิ่งแวดล้อม', 'Verified', NOW())
    ON CONFLICT (user_id) DO UPDATE SET license_number = 'ASM-9999', years_experience = 5, education_background = 'ปร.ด. สิ่งแวดล้อม', verification_status = 'Verified'
  `, [userId]);
  console.log('✅ Assessor profile verified.');

  // 6. Assign "Assessor Admin" role to user
  await client.query(`
    INSERT INTO user_roles (user_id, role_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [userId, roleId]);
  console.log('✅ Role assigned in user_roles.');

  console.log('🎉 Assessor Admin successfully seeded!');
  console.log(`   Email   : ${email}`);
  console.log(`   Password: ${password}`);

  await client.end();
}

seed().catch(e => {
  console.error('❌ Error during seeding:', e.message);
  process.exit(1);
});
