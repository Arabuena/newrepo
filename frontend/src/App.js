import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequestRide from './pages/RequestRide';
import DriverDashboard from './pages/DriverDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <div className="h-[calc(100vh-64px)]"> {/* 64px é a altura do Navbar */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/request-ride" 
                element={
                  <PrivateRoute>
                    <RequestRide />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/driver-dashboard" 
                element={
                  <PrivateRoute>
                    <DriverDashboard />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 