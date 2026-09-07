const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server root or project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'careeros_default_access_secret_for_dev_min32chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'careeros_default_refresh_secret_for_dev_min32chars',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
};

module.exports = config;
