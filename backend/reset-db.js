const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'project_green',
});

async function resetDb() {
  try {
    await client.connect();
    console.log('Connected to database.');
    
    console.log('Dropping public schema with CASCADE...');
    await client.query('DROP SCHEMA public CASCADE;');
    
    console.log('Recreating public schema...');
    await client.query('CREATE SCHEMA public;');
    
    console.log('Database schema successfully reset! TypeORM will recreate the tables on next start.');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.end();
  }
}

resetDb();
