import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import TrackingManager from '../../components/Admin/TrackingManager';

export default function AdminTracking() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }
  }, [userProfile, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            <AdminSidebar />
            
            <div className="flex-grow min-w-0">
              {/* Welcome Header */}
              <div className="mb-6 sm:mb-8 lg:mb-10 animate-fade-in">
                <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-primary-foreground shadow-lg">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Tracking Management</h1>
                  <p className="text-primary-foreground/90 text-base sm:text-lg">Manage all shipment tracking</p>
                  <p className="text-primary-foreground/70 mt-1 text-xs sm:text-sm">Update tracking status and monitor deliveries</p>
                </div>
              </div>

              {/* Tracking Manager */}
              <TrackingManager />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
