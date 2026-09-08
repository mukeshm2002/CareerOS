/**
 * CareerOS — VAPID Key Generation Utility
 *
 * Generates a standard Web Push VAPID keypair once.
 * Run via: node server/scripts/generate-vapid-keys.js
 *
 * DO NOT regenerate keys on every deployment.
 * If keys change, existing browser push subscriptions will fail and must re-subscribe.
 */

let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  // If not installed yet, try to load relative or advise
  console.error('web-push package is not installed yet. Run: npm --prefix server install web-push');
  process.exit(1);
}

const vapidKeys = webpush.generateVAPIDKeys();

console.log('=============================================================');
console.log('🔑 CAREEROS WEB PUSH — GENERATED VAPID KEYS');
console.log('=============================================================');
console.log('');
console.log('Add the following to your Backend environment (.env / Render):');
console.log('-------------------------------------------------------------');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@careeros.app`);
console.log('');
console.log('Add the following to your Frontend environment (.env / Vercel):');
console.log('-------------------------------------------------------------');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('');
console.log('=============================================================');
console.log('IMPORTANT:');
console.log('1. Keep VAPID_PRIVATE_KEY secret. Never expose it to client.');
console.log('2. VITE_VAPID_PUBLIC_KEY is safe for the browser client.');
console.log('3. Save these keys permanently. Do not rotate unless compromised.');
console.log('=============================================================');
