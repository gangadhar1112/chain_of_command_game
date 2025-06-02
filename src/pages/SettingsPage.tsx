import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Header from '../components/Header';
import ProfileSettings from '../components/ProfileSettings';
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/signin');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="flex items-center mb-6">
            <Settings className="text-purple-300 h-6 w-6 mr-2" />
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
          <ProfileSettings onClose={() => {}} />
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;