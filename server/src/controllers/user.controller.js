const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

class UserController {
  async getMyProfile(req, res, next) {
    try {
      if (!prisma) {
        return sendError(res, 'Database client not initialized', 500);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          onboardingCompleted: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      });

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, { user }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      if (!prisma) {
        return sendError(res, 'Database client not initialized', 500);
      }

      const {
        firstName,
        lastName,
        displayName,
        currentSituation,
        currentRole,
        targetRole,
        targetSalary,
        experienceLevel,
        timezone,
        country,
        wakeTime,
        workStartTime,
        workEndTime,
        personalStartTime,
        personalEndTime,
        sleepTime,
        availableCareerMinutes,
        careerMission,
        bio,
      } = req.body;

      const updatedProfile = await prisma.userProfile.upsert({
        where: { userId: req.user.id },
        update: {
          firstName,
          lastName,
          displayName,
          currentSituation,
          currentRole,
          targetRole,
          targetSalary,
          experienceLevel,
          timezone,
          country,
          wakeTime,
          workStartTime,
          workEndTime,
          personalStartTime,
          personalEndTime,
          sleepTime,
          availableCareerMinutes,
          careerMission,
          bio,
        },
        create: {
          userId: req.user.id,
          firstName,
          lastName,
          displayName,
          currentSituation,
          currentRole,
          targetRole,
          targetSalary,
          experienceLevel,
          timezone,
          country,
          wakeTime,
          workStartTime,
          workEndTime,
          personalStartTime,
          personalEndTime,
          sleepTime,
          availableCareerMinutes: availableCareerMinutes || 120,
          careerMission,
          bio,
        },
      });

      return sendSuccess(res, { profile: updatedProfile }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
