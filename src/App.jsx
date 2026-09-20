import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import SensorSimulatorModal from './components/simulator/SensorSimulatorModal';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import BinManagementPage from './pages/BinManagementPage';
import ComplaintsPage from './pages/ComplaintsPage';
import TasksPage from './pages/TasksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PublicBinPage from './pages/PublicBinPage';
import HomePage from './pages/HomePage';
import AdminDepartmentPage from './pages/AdminDepartmentPage';

import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function MainLayout() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [bins, setBins] = useState([]);
  const { user, loading: authLoading, openAdminWorkspace } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user?.role !== 'ADMIN') {
      openAdminWorkspace().catch((err) => console.error('Error opening admin workspace:', err));
      return;
    }
    fetchBins();
  }, [authLoading, user?.role]);

  const fetchBins = async () => {
    try {
      const res = await api.getBins();
      if (res.success) setBins(res.data);
    } catch (err) {
      console.error('Error loading bins for simulator:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onOpenSimulator={() => { fetchBins(); setIsSimulatorOpen(true); }} />

      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            {/* Core Direct Clean Routes (No forced login for demo) */}
            <Route path="/dashboard" element={<AdminDashboard onOpenSimulator={() => { fetchBins(); setIsSimulatorOpen(true); }} />} />
            <Route path="/bins" element={<BinManagementPage onOpenSimulator={() => { fetchBins(); setIsSimulatorOpen(true); }} />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Collection Worker Dashboard & Live Smart Route */}
            <Route path="/collections" element={
              <ProtectedRoute requiredRole="WORKER">
                <WorkerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute requiredRole="WORKER">
                <WorkerDashboard />
              </ProtectedRoute>
            } />

            {/* Citizen Complaint & Smart Bins Portal */}
            <Route path="/citizen" element={<ProtectedRoute requiredRole="CITIZEN"><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute requiredRole="CITIZEN"><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/my-complaints" element={<ProtectedRoute requiredRole="CITIZEN"><CitizenDashboard /></ProtectedRoute>} />

            {/* Public Smart Bin QR Code Page */}
            <Route path="/bin/:binCode" element={<PublicBinPage />} />

            {/* Legacy & Short URL Aliases for backward compatibility */}
            <Route path="/waste-management" element={<Navigate to="/dashboard" replace />} />
            <Route path="/waste-management/bins" element={<Navigate to="/bins" replace />} />
            <Route path="/waste-management/complaints" element={<Navigate to="/complaints" replace />} />
            <Route path="/waste-management/tasks" element={<Navigate to="/tasks" replace />} />
            <Route path="/waste-management/analytics" element={<Navigate to="/analytics" replace />} />
            <Route path="/waste-management/collections" element={<Navigate to="/collections" replace />} />
            <Route path="/waste-management/history" element={<Navigate to="/history" replace />} />
            <Route path="/waste-management/citizen" element={<Navigate to="/citizen" replace />} />
            <Route path="/waste-management/report" element={<Navigate to="/report" replace />} />
            <Route path="/waste-management/my-complaints" element={<Navigate to="/my-complaints" replace />} />
            <Route path="/waste-management/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/waste/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/waste" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/worker/*" element={<Navigate to="/collections" replace />} />
            <Route path="/citizen/*" element={<Navigate to="/citizen" replace />} />

            {/* Root catch-all redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Sensor Simulator Modal */}
      <SensorSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        bins={bins}
        onBinUpdated={fetchBins}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin-department" element={<AdminDepartmentPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/bin/:binCode" element={<PublicBinPage />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
