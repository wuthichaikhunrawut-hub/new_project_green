const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project_green',
});

async function run() {
  await client.connect();

  const ef = await client.query('SELECT COUNT(*) FROM emission_factors');
  console.log('emission_factors rows:', ef.rows[0].count);

  const gc = await client.query('SELECT COUNT(*) FROM green_criteria_master');
  console.log('green_criteria_master rows:', gc.rows[0].count);

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
