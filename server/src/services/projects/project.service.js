const prisma = require('../../config/db');

class ProjectService {
  /**
   * Validate goal ownership if goalId is provided
   */
  async validateGoalOwnership(userId, goalId) {
    if (!goalId) return;
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      const err = new Error('Referenced goal not found or does not belong to user');
      err.statusCode = 404;
      throw err;
    }
  }

  /**
   * Factual calculation of project progress based on milestones
   */
  computeMilestoneProgress(milestones = []) {
    if (!milestones || milestones.length === 0) {
      return {
        progressPercent: null,
        totalMilestones: 0,
        completedMilestones: 0,
        nonSkippedMilestones: 0,
      };
    }

    const nonSkipped = milestones.filter((m) => m.status !== 'SKIPPED');
    if (nonSkipped.length === 0) {
      return {
        progressPercent: null,
        totalMilestones: milestones.length,
        completedMilestones: 0,
        nonSkippedMilestones: 0,
      };
    }

    const completed = nonSkipped.filter((m) => m.status === 'COMPLETED').length;
    const progressPercent = Math.round((completed / nonSkipped.length) * 100);

    return {
      progressPercent,
      totalMilestones: milestones.length,
      completedMilestones: completed,
      nonSkippedMilestones: nonSkipped.length,
    };
  }

  /**
   * Factual calculation of 6-item portfolio readiness checklist
   */
  computePortfolioReadiness(project) {
    const checks = [
      {
        name: 'Description',
        passed: Boolean(project.description && project.description.trim().length > 0),
      },
      {
        name: 'Problem Statement',
        passed: Boolean(project.problemStatement && project.problemStatement.trim().length > 0),
      },
      {
        name: 'Skills',
        passed: Boolean(project.demonstratedSkills && project.demonstratedSkills.length > 0),
      },
      {
        name: 'Evidence',
        passed: Boolean(project.evidence && project.evidence.length > 0),
      },
      {
        name: 'Primary Link',
        passed: Boolean(project.repositoryUrl || project.liveUrl || project.demoUrl),
      },
      {
        name: 'Case Study',
        passed: Boolean(project.caseStudyUrl && project.caseStudyUrl.trim().length > 0),
      },
    ];

    const completedChecks = checks.filter((c) => c.passed).length;
    const totalChecks = checks.length;
    const missingItems = checks.filter((c) => !c.passed).map((c) => c.name);

    return {
      completedChecks,
      totalChecks,
      missingItems,
      isReady: completedChecks === totalChecks,
    };
  }

  /**
   * Compute focused minutes for a project (completed sessions only)
   */
  async getProjectFocusedMinutes(projectId, userId) {
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        task: {
          projectId,
        },
      },
      select: {
        actualMinutes: true,
        durationMinutes: true,
      },
    });

    return sessions.reduce((acc, s) => acc + (s.actualMinutes || s.durationMinutes || 0), 0);
  }

  /**
   * List projects with filters and factual metrics
   */
  async listProjects(userId, query = {}) {
    const where = { userId };

    if (query.archived === 'true' || query.archived === true) {
      where.OR = [
        { status: 'ARCHIVED' },
        { archivedAt: { not: null } },
      ];
    } else {
      where.status = { not: 'ARCHIVED' };
      where.archivedAt = null;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.projectType && query.projectType !== 'ALL') {
      where.projectType = query.projectType;
    }

    if (query.goalId) {
      where.goalId = query.goalId;
    }

    if (query.portfolio === 'true' || query.portfolio === true) {
      where.isPortfolioVisible = true;
    }

    if (query.skillId) {
      where.demonstratedSkills = {
        some: {
          skillId: query.skillId,
        },
      };
    }

    if (query.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        goal: {
          select: { id: true, title: true },
        },
        demonstratedSkills: {
          include: {
            skill: {
              select: { id: true, name: true, category: true },
            },
          },
        },
        milestones: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
        evidence: {
          include: {
            skills: {
              include: {
                skill: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const enrichedProjects = projects.map((project) => {
      const progressMeta = this.computeMilestoneProgress(project.milestones);
      const readiness = this.computePortfolioReadiness(project);
      return {
        ...project,
        progressPercent: progressMeta.progressPercent,
        milestoneProgress: progressMeta,
        portfolioReadiness: readiness,
      };
    });

    // Summary stats
    const [activeCount, completedCount, portfolioCount, totalEvidenceCount] = await Promise.all([
      prisma.project.count({
        where: {
          userId,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          archivedAt: null,
        },
      }),
      prisma.project.count({
        where: {
          userId,
          status: 'COMPLETED',
          archivedAt: null,
        },
      }),
      prisma.project.count({
        where: {
          userId,
          isPortfolioVisible: true,
          archivedAt: null,
        },
      }),
      prisma.evidence.count({
        where: { userId },
      }),
    ]);

    return {
      projects: enrichedProjects,
      summary: {
        activeProjects: activeCount,
        completedProjects: completedCount,
        portfolioReady: portfolioCount,
        evidenceItems: totalEvidenceCount,
      },
    };
  }

  /**
   * Get single project by ID with full details and factual metrics
   */
  async getProjectById(userId, projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        goal: {
          select: { id: true, title: true },
        },
        demonstratedSkills: {
          include: {
            skill: {
              select: { id: true, name: true, category: true },
            },
          },
        },
        milestones: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          include: {
            tasks: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
        tasks: {
          include: {
            projectMilestone: {
              select: { id: true, title: true },
            },
            focusSessions: {
              where: { status: 'COMPLETED' },
              select: { actualMinutes: true, durationMinutes: true },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
        },
        evidence: {
          include: {
            skills: {
              include: {
                skill: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const progressMeta = this.computeMilestoneProgress(project.milestones);
    const readiness = this.computePortfolioReadiness(project);
    const focusedMinutes = await this.getProjectFocusedMinutes(projectId, userId);

    // Enrich tasks with their focused time
    const enrichedTasks = project.tasks.map((task) => {
      const taskFocusedTime = (task.focusSessions || []).reduce(
        (acc, fs) => acc + (fs.actualMinutes || fs.durationMinutes || 0),
        0
      );
      return {
        ...task,
        focusedMinutes: taskFocusedTime,
      };
    });

    return {
      ...project,
      tasks: enrichedTasks,
      progressPercent: progressMeta.progressPercent,
      milestoneProgress: progressMeta,
      portfolioReadiness: readiness,
      focusedMinutes,
    };
  }

  /**
   * Create new project
   */
  async createProject(userId, data) {
    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const status = data.status || 'IDEA';
    const completedAt = status === 'COMPLETED' ? new Date() : null;

    const project = await prisma.project.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        projectType: data.projectType || 'PERSONAL',
        status,
        priority: data.priority || 'MEDIUM',
        problemStatement: data.problemStatement || null,
        objective: data.objective || null,
        goalId: data.goalId || null,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        completedAt,
        repositoryUrl: data.repositoryUrl || null,
        liveUrl: data.liveUrl || null,
        demoUrl: data.demoUrl || null,
        caseStudyUrl: data.caseStudyUrl || null,
        isPortfolioVisible: data.isPortfolioVisible || false,
      },
    });

    // Link skills if provided
    if (Array.isArray(data.skillIds) && data.skillIds.length > 0) {
      for (const skillId of data.skillIds) {
        await this.addSkill(userId, project.id, { skillId });
      }
    } else if (Array.isArray(data.skills) && data.skills.length > 0) {
      for (const item of data.skills) {
        await this.addSkill(userId, project.id, item);
      }
    }

    return this.getProjectById(userId, project.id);
  }

  /**
   * Update existing project
   */
  async updateProject(userId, projectId, data) {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!existing) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.projectType !== undefined) updateData.projectType = data.projectType;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.problemStatement !== undefined) updateData.problemStatement = data.problemStatement;
    if (data.objective !== undefined) updateData.objective = data.objective;
    if (data.goalId !== undefined) updateData.goalId = data.goalId || null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    if (data.repositoryUrl !== undefined) updateData.repositoryUrl = data.repositoryUrl;
    if (data.liveUrl !== undefined) updateData.liveUrl = data.liveUrl;
    if (data.demoUrl !== undefined) updateData.demoUrl = data.demoUrl;
    if (data.caseStudyUrl !== undefined) updateData.caseStudyUrl = data.caseStudyUrl;
    if (data.isPortfolioVisible !== undefined) updateData.isPortfolioVisible = data.isPortfolioVisible;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (data.status !== 'COMPLETED' && existing.status === 'COMPLETED') {
        updateData.completedAt = null;
      }
      if (data.status === 'ARCHIVED' && !existing.archivedAt) {
        updateData.archivedAt = new Date();
      } else if (data.status !== 'ARCHIVED' && existing.status === 'ARCHIVED') {
        updateData.archivedAt = null;
      }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return this.getProjectById(userId, projectId);
  }

  /**
   * Update status
   */
  async updateStatus(userId, projectId, status) {
    return this.updateProject(userId, projectId, { status });
  }

  /**
   * Toggle or set portfolio visibility
   */
  async togglePortfolio(userId, projectId, isVisible) {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!existing) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const targetVisibility = typeof isVisible === 'boolean'
      ? isVisible
      : !existing.isPortfolioVisible;

    await prisma.project.update({
      where: { id: projectId },
      data: { isPortfolioVisible: targetVisibility },
    });

    return this.getProjectById(userId, projectId);
  }

  /**
   * Safe delete project: unlinks tasks and evidence so no historical data is destroyed
   */
  async deleteProject(userId, projectId) {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!existing) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Safely unlink tasks and evidence
    await prisma.task.updateMany({
      where: { projectId },
      data: { projectId: null, projectMilestoneId: null },
    });

    await prisma.evidence.updateMany({
      where: { projectId },
      data: { projectId: null, projectMilestoneId: null },
    });

    // Delete project skills and milestones
    await prisma.projectSkill.deleteMany({
      where: { projectId },
    });

    await prisma.projectMilestone.deleteMany({
      where: { projectId },
    });

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true, message: 'Project deleted safely' };
  }

  /**
   * Add demonstrated skill to project
   */
  async addSkill(userId, projectId, { skillId, usageLevel, notes }) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      const err = new Error('Skill not found');
      err.statusCode = 404;
      throw err;
    }

    const existingRelation = await prisma.projectSkill.findUnique({
      where: {
        projectId_skillId: { projectId, skillId },
      },
    });

    if (existingRelation) {
      return prisma.projectSkill.update({
        where: { id: existingRelation.id },
        data: {
          usageLevel: usageLevel !== undefined ? usageLevel : existingRelation.usageLevel,
          notes: notes !== undefined ? notes : existingRelation.notes,
        },
        include: { skill: true },
      });
    }

    return prisma.projectSkill.create({
      data: {
        projectId,
        skillId,
        usageLevel: usageLevel || null,
        notes: notes || null,
      },
      include: { skill: true },
    });
  }

  /**
   * Remove demonstrated skill from project
   */
  async removeSkill(userId, projectId, skillId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const existingRelation = await prisma.projectSkill.findUnique({
      where: {
        projectId_skillId: { projectId, skillId },
      },
    });

    if (!existingRelation) {
      const err = new Error('Skill not linked to this project');
      err.statusCode = 404;
      throw err;
    }

    await prisma.projectSkill.delete({
      where: { id: existingRelation.id },
    });

    return { success: true, message: 'Skill removed from project' };
  }
}

module.exports = new ProjectService();
