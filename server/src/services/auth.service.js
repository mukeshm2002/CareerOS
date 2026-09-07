const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');

class AuthService {
  async register({ email, password, fullName }) {
    if (!prisma) {
      const error = new Error('Database client is not initialized');
      error.statusCode = 500;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const error = new Error('An account with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Split name into first and last if possible
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        onboardingCompleted: false,
        profile: {
          create: {
            firstName,
            lastName,
            displayName: fullName.trim(),
            onboardingStep: 1,
            availableCareerMinutes: 140,
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        onboardingCompleted: true,
        createdAt: true,
        profile: true,
      },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        profile: user.profile,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login({ email, password }) {
    if (!prisma) {
      const error = new Error('Database client is not initialized');
      error.statusCode = 500;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
      },
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        onboardingCompleted: user.onboardingCompleted,
        lastLoginAt: new Date(),
        profile: user.profile,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(rawRefreshToken) {
    if (!prisma) {
      const error = new Error('Database client is not initialized');
      error.statusCode = 500;
      throw error;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: rawRefreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      const error = new Error('Refresh token revoked or expired');
      error.statusCode = 401;
      throw error;
    }

    const tokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    // Rotate refresh token
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.userId,
          expiresAt,
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId, refreshToken) {
    if (!prisma) return;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId,
        },
      });
    } else {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }
  }

  async logoutAll(userId) {
    if (!prisma) return;
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async getCurrentUser(userId) {
    if (!prisma) {
      const error = new Error('Database client is not initialized');
      error.statusCode = 500;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        onboardingCompleted: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }
}

module.exports = new AuthService();
