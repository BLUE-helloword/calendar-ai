import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/login';
import DashboardPage from './pages/dashboard';
import GoalNewPage from './pages/goal/GoalNewPage';
import GoalClarifyPage from './pages/goal/GoalClarifyPage';
import GoalConfirmPage from './pages/goal/GoalConfirmPage';
import PlanPage from './pages/plan/PlanPage';
import TaskListPage from './pages/task/TaskListPage';
import TaskDetailPage from './pages/task/TaskDetailPage';
import ReportPage from './pages/report/ReportPage';
import ReminderPage from './pages/reminder/ReminderPage';
import WeekCalendarPage from './pages/calendar/WeekCalendarPage';
import WorkbenchPage from './pages/workbench/WorkbenchPage';
import SettingsPage from './pages/settings/SettingsPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <WorkbenchPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'goals/new', element: <GoalNewPage /> },
      { path: 'goals/:id/clarify', element: <GoalClarifyPage /> },
      { path: 'goals/:id/confirm', element: <GoalConfirmPage /> },
      { path: 'goals/:id/plan', element: <PlanPage /> },
      { path: 'tasks', element: <TaskListPage /> },
      { path: 'tasks/:id', element: <TaskDetailPage /> },
      { path: 'calendar', element: <WeekCalendarPage /> },
      { path: 'report', element: <ReportPage /> },
      { path: 'reminders', element: <ReminderPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

const App: React.FC = () => <RouterProvider router={router} />;
export default App;
