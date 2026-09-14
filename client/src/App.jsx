import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { WelcomePage } from './pages/WelcomePage';
import { useAuthStore } from './store/authStore';

// Main App Pages
import { OverviewPage } from './pages/OverviewPage';
import { MyDayPage } from './pages/MyDayPage';
import { MorePage } from './pages/MorePage';
import { TasksPage } from './pages/TasksPage';
import { SchedulePage } from './pages/SchedulePage';
import { GoalsPage } from './pages/GoalsPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SkillsPage } from './pages/SkillsPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { HealthPage } from './pages/HealthPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LearningPage } from './pages/LearningPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { RemindersPage } from './pages/RemindersPage';
import { WorkLogHistoryPage } from './pages/WorkLogHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Onboarding Flow (Requires Authenticated User) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarded={false}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected App Routes with Persistent Layout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/today" replace />} />
        <Route path="today" element={<MyDayPage />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:goalId" element={<GoalDetailPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectsPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="learning/:learningPathId" element={<LearningPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="work-log" element={<WorkLogHistoryPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Root redirect: if authenticated go to app, otherwise show calm Welcome entrance */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/app" replace /> : <WelcomePage />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
