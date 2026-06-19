const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project-green',
});

const roles = [
  'System Admin',
  'Organization Admin',
  'Executive',
  'Employee',
  'Assessor',
  'Assessor Admin',
  'User',
];

async function seed() {
  await client.connect();
  console.log('🌱 Starting full user and role seeding...');

  // 1. Seed Roles
  const roleIdMap = {};
  for (const roleName of roles) {
    const res = await client.query(
      `INSERT INTO roles (role_name) VALUES ($1) 
       ON CONFLICT (role_name) DO UPDATE SET role_name = $1 
       RETURNING role_id`,
      [roleName]
    );
    roleIdMap[roleName] = res.rows[0].role_id;
  }
  console.log('✅ Roles seeded:', roleIdMap);

  // 2. Ensure Organization exists
  const orgRes = await client.query(
    `INSERT INTO organizations (name, tax_id, industry_type, number_of_employees, total_floor_area, working_hours_per_year, target_reduction_percent)
     VALUES ('Main Organization', '1234567890123', 'Office', 100, 2500, 2000, 10)
     ON CONFLICT DO NOTHING
     RETURNING org_id`
  );
  let orgId;
  if (orgRes.rows.length > 0) {
    orgId = orgRes.rows[0].org_id;
  } else {
    const existingOrg = await client.query("SELECT org_id FROM organizations LIMIT 1");
    orgId = existingOrg.rows[0].org_id;
  }
  console.log(`✅ Organization verified. ID: ${orgId}`);

  // 3. Define users
  const users = [
    {
      email: 'Admin@testmail.com',
      password: 'admin123',
      role: 'System Admin',
      firstName: 'แอดมิน',
      lastName: 'ระบบ',
    },
    {
      email: 'User@testmail.com',
      password: 'admin123',
      role: 'Organization Admin',
      firstName: 'สมชาย',
      lastName: 'รักษ์โลก',
    },
    {
      email: 'sivimon@testmail.com',
      password: 'admin123',
      role: 'Assessor Admin',
      firstName: 'ศิวิมล',
      lastName: 'มาลักษณ์',
    },
    {
      email: 'assessor@testmail.com',
      password: 'admin123',
      role: 'Assessor',
      firstName: 'สมพงษ์',
      lastName: 'ตรวจงาน',
    },
    {
      email: 'exec@testmail.com',
      password: 'admin123',
      role: 'Executive',
      firstName: 'ประธาน',
      lastName: 'สมาคม',
    }
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    // Create/update user
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, is_active, org_id)
       VALUES ($1, $2, true, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, is_active = true, org_id = $3
       RETURNING user_id`,
      [u.email, hash, orgId]
    );
    const userId = userRes.rows[0].user_id;

    // Create/update profile
    await client.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, phone)
       VALUES ($1, $2, $3, '0812345678')
       ON CONFLICT (user_id) DO UPDATE SET first_name = $2, last_name = $3
       `,
      [userId, u.firstName, u.lastName]
    );

    // Assign role
    const roleId = roleIdMap[u.role];
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, roleId]
    );

    // If assessor, create assessor profile
    if (u.role === 'Assessor' || u.role === 'Assessor Admin') {
      await client.query(
        `INSERT INTO assessor_profiles (user_id, license_number, years_experience, education_background, verification_status, verified_at)
         VALUES ($1, $2, 5, 'ปร.ด. สิ่งแวดล้อม', 'Verified', NOW())
         ON CONFLICT (user_id) DO UPDATE SET verification_status = 'Verified'`,
        [userId, `ASM-${userId}`]
      );
    }

    console.log(`✅ User seeded: ${u.email} (${u.role})`);
  }

  console.log('🎉 Seeding successfully completed!');
  await client.end();
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e.message);
  process.exit(1);
});
