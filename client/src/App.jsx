import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

// Auth & Onboarding Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';

// Main App Pages
import { OverviewPage } from './pages/OverviewPage';
import { MyDayPage } from './pages/MyDayPage';
import { TasksPage } from './pages/TasksPage';
import { SchedulePage } from './pages/SchedulePage';
import { GoalsPage } from './pages/GoalsPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SkillsPage } from './pages/SkillsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LearningPage } from './pages/LearningPage';
import { ProgressPage } from './pages/ProgressPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { RemindersPage } from './pages/RemindersPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
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
        <Route index element={<OverviewPage />} />
        <Route path="today" element={<MyDayPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="goals/:goalId" element={<GoalDetailPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="opportunities" element={<OpportunitiesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectsPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="learning/:learningPathId" element={<LearningPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
