import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage';
import { AddVehiclePage } from './pages/AddVehiclePage';
import { EditVehiclePage } from './pages/EditVehiclePage';
import { PurchaseConfirmPage } from './pages/PurchaseConfirmPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public & Showroom Routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/:id" element={<VehicleDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />

                {/* Authenticated Customer Routes */}
                <Route
                  path="/inventory/:id/purchase"
                  element={
                    <ProtectedRoute>
                      <PurchaseConfirmPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <TransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Administrative Vehicle Management (Admin Only) */}
                <Route
                  path="/vehicles/new"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AddVehiclePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/:id/edit"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <EditVehiclePage />
                    </ProtectedRoute>
                  }
                />

                {/* Restricted Fleet Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

            <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>
                  © 2026 Apex Motors Inventory Systems Inc. All rights reserved.
                </span>
                <span className="text-slate-400">
                  Production-Ready Dealership Platform • ACID Concurrency Secured
                </span>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
