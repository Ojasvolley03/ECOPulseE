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

import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles }) {
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/waste-management" replace />;
    if (user.role === 'WORKER') return <Navigate to="/waste-management/collections" replace />;
    return <Navigate to="/waste-management/citizen" replace />;
  }

  return children;
}

function MainLayout() {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [bins, setBins] = useState([]);

  useEffect(() => {
    fetchBins();
  }, []);

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
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            {/* Professional SaaS Routes for Waste Management */}
            {/* Admin Routes */}
            <Route path="/waste-management" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard onOpenSimulator={() => { fetchBins(); setIsSimulatorOpen(true); }} />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/bins" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <BinManagementPage onOpenSimulator={() => { fetchBins(); setIsSimulatorOpen(true); }} />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/complaints" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ComplaintsPage />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/tasks" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TasksPage />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/analytics" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AnalyticsPage />
              </ProtectedRoute>
            } />

            {/* Collection Worker Routes */}
            <Route path="/waste-management/collections" element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/history" element={
              <ProtectedRoute allowedRoles={['WORKER']}>
                <WorkerDashboard />
              </ProtectedRoute>
            } />

            {/* Citizen Routes */}
            <Route path="/waste-management/citizen" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/report" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />
            <Route path="/waste-management/my-complaints" element={
              <ProtectedRoute allowedRoles={['CITIZEN']}>
                <CitizenDashboard />
              </ProtectedRoute>
            } />

            {/* Legacy URL Redirects for seamless backward compatibility */}
            <Route path="/admin/*" element={<Navigate to="/waste-management" replace />} />
            <Route path="/worker/*" element={<Navigate to="/waste-management/collections" replace />} />
            <Route path="/citizen/*" element={<Navigate to="/waste-management/citizen" replace />} />
            <Route path="/dashboard" element={<Navigate to="/waste-management" replace />} />

            {/* Root catch-all redirect */}
            <Route path="*" element={<Navigate to="/waste-management" replace />} />
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
