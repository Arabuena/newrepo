import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PassengerRegister from './pages/PassengerRegister';
import DriverRegister from './pages/DriverRegister';
import RequestRide from './pages/RequestRide';
import DriverDashboard from './pages/DriverDashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './pages/AdminDashboard';
import RideDetails from './pages/RideDetails';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="h-[calc(100vh-64px)]"> {/* 64px é a altura do Navbar */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register/passenger" element={<PassengerRegister />} />
            <Route path="/register/driver" element={<DriverRegister />} />
            <Route 
              path="/request-ride" 
              element={
                <PrivateRoute roles={['passenger']}>
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
            <Route 
              path="/admin" 
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/rides/:rideId" 
              element={
                <PrivateRoute roles={['passenger', 'driver']}>
                  <RideDetails />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 