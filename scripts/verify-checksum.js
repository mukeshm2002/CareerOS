const fs = require('fs');
const crypto = require('crypto');

const content = fs.readFileSync('prisma/migrations/20260907143000_phase1c_career_planning/migration.sql', 'utf8');
const hash = crypto.createHash('sha256').update(content).digest('hex');

console.log('Current File Hash:', hash);
console.log('Recorded in DB:   6e862e2ad9e1515b973af9d70072b9d60fca6c5886df05b4dfbca6eae8ecc2c0');
