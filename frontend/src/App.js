import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Bookings from './pages/Bookings';
import Confirmation from './pages/Confirmation';
import Entry from './pages/Entry';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import OverflowBooking from './pages/OverflowBooking';
import './index.css'; 
import './App.css'; 
import SimulationPage from "./pages/SimulationPage";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, user, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/simulation" element={<SimulationPage />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              
              <Route path="/book" element={
                <ProtectedRoute>
                  <div className="main-content">
                    <Booking />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/overflow-book" element={
                <ProtectedRoute>
                  <div className="main-content">
                    <OverflowBooking />
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/confirmation" element={
                <ProtectedRoute>
                  <div className="main-content">
                    <Confirmation />
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/entry" element={
                <ProtectedRoute>
                  <div className="main-content">
                    <Entry />
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <div className="main-content">
                    <Bookings />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <div className="main-content">
                    <Profile />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;