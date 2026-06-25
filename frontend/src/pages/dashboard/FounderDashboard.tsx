import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../shared/lib/api';
import type { User } from '../../shared/lib/api';
import { Plus } from 'lucide-react';
import { useToast } from '../../shared/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

import DashboardStats from './DashboardStats';
import QuickActions from './QuickActions';
import FounderView from './FounderView';
import PreferencesView from './PreferencesView';

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'preferences'>('overview');

  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'founder') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleUserUpdate = () => {
      const u = apiService.getCurrentUser();
      if (u && u.role === 'founder') {
        setUser(u);
      }
    };
    window.addEventListener('invesa_user_updated', handleUserUpdate);
    return () => {
      window.removeEventListener('invesa_user_updated', handleUserUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestStatus = async (ideaId: string, requestId: string, accept: boolean) => {
    try {
      await apiService.handleJoinRequest(ideaId, requestId, accept);
      success(accept ? 'Join request accepted!' : 'Join request rejected.');
      fetchDashboardData(); // Refresh data
    } catch (err: any) {
      toastError(err.message || 'Action failed');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-default flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-white/40 text-sm">Loading your account…</span>
        </div>
      </div>
    );
  }

  const density = user.preferences?.density || 'spacious';

  return (
    <div className="min-h-screen bg-surface-default pt-10 sm:pt-12 pb-24 relative animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Hey, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/40 text-xs mt-0.5 capitalize">{user?.role} Account</p>
          </div>
          {activeTab === 'overview' && (
            <Link to="/post-idea" className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              Post Project
            </Link>
          )}
        </div>

        {/* Google-styled Sub-tab Switcher */}
        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-0.5 font-sans">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'overview' ? 'text-[#8ab4f8]' : 'text-white/40 hover:text-white'
            }`}
          >
            Overview
            {activeTab === 'overview' && (
              <motion.div 
                layoutId="activeSubTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8ab4f8] rounded-full" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 px-1 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'preferences' ? 'text-[#8ab4f8]' : 'text-white/40 hover:text-white'
            }`}
          >
            Profile & Preferences
            {activeTab === 'preferences' && (
              <motion.div 
                layoutId="activeSubTab" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8ab4f8] rounded-full" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' ? (
              <div className="space-y-8">
                <QuickActions density={density} />
                <DashboardStats density={density} />
                <FounderView 
                  dashboardData={dashboardData} 
                  loading={loading} 
                  handleRequestStatus={handleRequestStatus}
                  density={density}
                />
              </div>
            ) : (
              <PreferencesView 
                user={user} 
                onProfileUpdated={() => {
                  fetchDashboardData();
                }} 
              />
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}
