'use strict';

const required = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'ALLOWED_ORIGINS',
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

const failures = [];
const value = (name) => String(process.env[name] || '').trim();

if (value('NODE_ENV') !== 'production') {
  failures.push('NODE_ENV must be production');
}

for (const name of required) {
  if (!value(name)) failures.push(`${name} is required`);
}

if (value('DB_SYNCHRONIZE').toLowerCase() !== 'false') {
  failures.push('DB_SYNCHRONIZE must be false');
}

if (value('JWT_SECRET').length < 32) {
  failures.push('JWT_SECRET must contain at least 32 characters');
}

const origins = value('ALLOWED_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (origins.includes('*')) failures.push('ALLOWED_ORIGINS cannot contain *');
if (origins.some((origin) => !origin.startsWith('https://'))) {
  failures.push('Every production origin must use https://');
}

if (value('STRIPE_SECRET_KEY') && !value('STRIPE_WEBHOOK_SECRET')) {
  failures.push('STRIPE_WEBHOOK_SECRET is required when Stripe is enabled');
}

if (failures.length) {
  console.error('Production preflight failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Production preflight passed (${required.length} required settings checked; secret values hidden).`,
);
