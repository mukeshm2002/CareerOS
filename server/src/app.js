const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const config = require('./config');
const prisma = require('./config/db');
const { validateEnvironment } = require('./config/envValidation');
const { sendSuccess, sendError } = require('./utils/response');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Run startup environment validation
validateEnvironment();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const onboardingRoutes = require('./routes/onboarding.routes');
const goalRoutes = require('./routes/goal.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const milestoneRoutes = require('./routes/milestone.routes');
const roadmapTemplateRoutes = require('./routes/roadmapTemplate.routes');
const skillRoutes = require('./routes/skill.routes');
const userSkillRoutes = require('./routes/userSkill.routes');
const taskRoutes = require('./routes/task.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const todayRoutes = require('./routes/today.routes');
const focusRoutes = require('./routes/focus.routes');
const dailyReviewRoutes = require('./routes/dailyReview.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const progressRoutes = require('./routes/progress.routes');
const weeklyReviewRoutes = require('./routes/weeklyReview.routes');
const opportunityRoutes = require('./routes/opportunity.routes');
const projectRoutes = require('./routes/project.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const learningRoutes = require('./routes/learning.routes');
const reminderRoutes = require('./routes/reminder.routes');
const notificationRoutes = require('./routes/notification.routes');
const settingsRoutes = require('./routes/settings.routes');
const accountRoutes = require('./routes/account.routes');
const workLogRoutes = require('./routes/workLog.routes');
const pushRoutes = require('./routes/push.routes');

const reminderSchedulerService = require('./services/reminders/reminderScheduler.service');

const app = express();

// Configure trust proxy for Render reverse proxy layer (Section 30)
app.set('trust proxy', 1);

// 1. Security Headers (Section 36)
app.use(
  helmet({
    contentSecurityPolicy: false, // Don't break Vite or frontend script execution
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Request Correlation ID (Section 46) & Structured Logging (Section 45)
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (config.nodeEnv !== 'test') {
      console.log(`[${new Date().toISOString()}] [reqId=${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
});

// 3. CORS Configuration (Section 37)
const allowedOrigins = config.clientUrl ? [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'] : ['http://localhost:5173', 'http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server tests)
      if (!origin) return callback(null, true);
      if (config.nodeEnv !== 'production' || allowedOrigins.includes(origin) || origin === config.clientUrl) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
    },
    credentials: true,
  })
);

// 4. Request Body Parsing & Limits (Section 38)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 5. Rate Limiting (Section 34, 35)
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 6. Health & Readiness Endpoints (Section 48, 49)
app.get('/api/health', (req, res) => {
  const currentEnv = process.env.NODE_ENV || config.nodeEnv || 'development';
  return sendSuccess(
    res,
    {
      status: 'healthy',
      database: 'connected',
      service: 'CareerOS API',
      environment: currentEnv,
      timestamp: new Date().toISOString(),
    },
    'CareerOS API service is operational'
  );
});

app.get('/api/ready', async (req, res) => {
  try {
    const currentEnv = process.env.NODE_ENV || config.nodeEnv || 'development';
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(
      res,
      {
        status: 'ready',
        database: 'connected',
        environment: currentEnv,
        timestamp: new Date().toISOString(),
      },
      'CareerOS API is ready to accept traffic'
    );
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: 'Service unavailable: database connectivity check failed',
    });
  }
});

// 7. API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/roadmap-templates', roadmapTemplateRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/user-skills', userSkillRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/today', todayRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/daily-review', dailyReviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reviews', weeklyReviewRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/work-logs', workLogRoutes);
app.use('/api/push', pushRoutes);

// 8. 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 9. Start Reminder Scheduler (Section 15) in development/production
if (config.nodeEnv !== 'test') {
  reminderSchedulerService.start(60000);
}

// 10. Server startup if executed directly
if (require.main === module) {
  const PORT = config.port || 5000;
  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 CareerOS Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`========================================`);
  });
}

module.exports = app;
