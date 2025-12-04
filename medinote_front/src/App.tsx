// src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import useHealthDataStore from './store/useHealthDataStore';
import { kstYmd } from './utils/date';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AppLayout from './components/common/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminRoute from './components/admin/AdminRoute';
import useUserStore from './store/useUserStore';


import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import HealthInfoPage from './pages/HealthInfo/HealthInfoPage';
import MedicalHistoryPage from './pages/MedicalHistory/MedicalHistoryPage';
import AnalysisPage from './pages/Analysis/AnalysisPage';
import SchedulePage from './pages/Schedule/SchedulePage';
import ChatbotPage from './pages/Chatbot/ChatbotPage';
import SettingsPage from './pages/Settings/SettingsPage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import FeedbackManagementPage from './pages/admin/FeedbackManagementPage';


function App() {
  const updateCurrentDate = useHealthDataStore((s) => s.updateCurrentDate);
  const loadAuthFromStorage = useUserStore((s) => s.loadAuthFromStorage);

  useEffect(() => {
    loadAuthFromStorage();
  }, [loadAuthFromStorage]);

  useEffect(() => {
    const tick = () => {
      updateCurrentDate(kstYmd());
    };
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [updateCurrentDate]);
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes under layout (absolute paths) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="feedbacks" element={<FeedbackManagementPage />} />
              </Route>
            </Route>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Health info supports deep-link tabs */}
              <Route path="/health-info/:tab?" element={<HealthInfoPage />} />
              <Route path="/history" element={<MedicalHistoryPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
        </Routes>
      </BrowserRouter>

      {/* ToastContainer - 최상단에 위치 */}
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        hideProgressBar
        pauseOnHover={false}
        theme="colored"
      />
    </>
  );
}

export default App;

