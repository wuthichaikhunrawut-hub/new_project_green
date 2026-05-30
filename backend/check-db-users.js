const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'greenoffice',
});

async function run() {
  await client.connect();
  const sql = `
    SELECT u.user_id, u.email, r.role_name 
    FROM users u 
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id 
    LEFT JOIN roles r ON ur.role_id = r.role_id 
    WHERE UPPER(r.role_name) IN ('ASSESSOR', 'ASSESSOR ADMIN', 'ASSESSOR_ADMIN')
  `;
  const res = await client.query(sql);
  console.log('--- JOIN QUERY RESULT ---');
  console.log(res.rows);

  await client.end();
}
run().catch(console.error);
