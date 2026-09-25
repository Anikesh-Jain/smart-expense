import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import ConfirmDialog from '../ui/ConfirmDialog';
import toast from 'react-hot-toast';

const AppLayout = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-dark-950 text-dark-100 font-sans antialiased">
      {/* Desktop Sidebar */}
      <Sidebar onOpenLogoutModal={() => setShowLogoutConfirm(true)} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <Navbar onOpenLogoutModal={() => setShowLogoutConfirm(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenLogoutModal={() => setShowLogoutConfirm(true)} />

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        isDestructive={true}
      />
    </div>
  );
};

export default AppLayout;
