/**
 * CareerOS Production Pre-Flight Verification Script
 * Validates production environment configuration, database connectivity, and security parameters.
 * Non-destructive: safe to execute in any environment.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function verifyProduction() {
  console.log('====================================================');
  console.log('🔍 CareerOS V1 — Production Pre-Flight Verification');
  console.log('====================================================\n');

  let errors = 0;
  let warnings = 0;

  function pass(msg) {
    console.log(`  ✅ [PASS] ${msg}`);
  }
  function fail(msg) {
    console.log(`  ❌ [FAIL] ${msg}`);
    errors++;
  }
  function warn(msg) {
    console.log(`  ⚠️ [WARN] ${msg}`);
    warnings++;
  }

  // 1. Environment Variable Checks
  console.log('1. Checking Environment Variables:');
  const env = process.env.NODE_ENV || 'development';
  console.log(`   NODE_ENV: ${env}`);
  if (env !== 'production') {
    warn(`NODE_ENV is set to "${env}" (expected "production" in production environments).`);
  } else {
    pass('NODE_ENV is set to "production"');
  }

  const requiredVars = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  for (const v of requiredVars) {
    if (!process.env[v]) {
      fail(`Missing required environment variable: ${v}`);
    } else {
      pass(`Environment variable present: ${v}`);
    }
  }

  const corsUrl = process.env.CLIENT_URL || process.env.CORS_ORIGIN;
  if (!corsUrl) {
    fail('Missing required environment variable: CLIENT_URL or CORS_ORIGIN');
  } else {
    pass(`CORS client origin configured: ${corsUrl}`);
  }

  if (!process.env.DIRECT_URL) {
    warn('DIRECT_URL is not set. In Neon environments, DIRECT_URL is required for migrations.');
  } else {
    pass('DIRECT_URL is configured');
  }

  // 2. Security Checks
  console.log('\n2. Security & Secret Length Validation:');
  const accessSecret = process.env.JWT_ACCESS_SECRET || '';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '';

  if (accessSecret.length >= 32) {
    pass(`JWT_ACCESS_SECRET length is sufficient (${accessSecret.length} chars >= 32 chars)`);
  } else {
    fail(`JWT_ACCESS_SECRET length is too short (${accessSecret.length} chars < 32 chars)`);
  }

  if (refreshSecret.length >= 32) {
    pass(`JWT_REFRESH_SECRET length is sufficient (${refreshSecret.length} chars >= 32 chars)`);
  } else {
    fail(`JWT_REFRESH_SECRET length is too short (${refreshSecret.length} chars < 32 chars)`);
  }

  if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
    fail('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct secrets.');
  } else if (accessSecret && refreshSecret) {
    pass('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are distinct');
  }

  // 3. Database Connectivity Check
  console.log('\n3. Database Connectivity & Prisma Validation:');
  const prisma = new PrismaClient();
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as connected;`;
    const latency = Date.now() - startTime;
    pass(`Database connectivity successful (latency: ${latency}ms)`);
  } catch (err) {
    fail(`Database connection failed: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }

  // 4. Summary
  console.log('\n====================================================');
  console.log(`Pre-Flight Check Completed: ${errors} error(s), ${warnings} warning(s)`);
  console.log('====================================================');

  if (errors > 0) {
    console.error('\n❌ Production pre-flight checks FAILED.');
    process.exit(1);
  } else {
    console.log('\n✅ Production pre-flight checks PASSED.');
    process.exit(0);
  }
}

verifyProduction().catch((err) => {
  console.error('Fatal pre-flight execution error:', err);
  process.exit(1);
});
