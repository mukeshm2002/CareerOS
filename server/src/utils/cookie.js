const config = require('../config');

const REFRESH_COOKIE_NAME = 'refreshToken';

const getRefreshCookieOptions = () => {
  const isProd = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/api/auth',
  });
};

module.exports = {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
  setRefreshCookie,
  clearRefreshCookie,
};
