import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Button from '../components/Button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-purple-900 p-4">
      <div className="max-w-md w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg border border-purple-700/50 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-purple-700 rounded-full mb-4">
          <AlertCircle className="text-red-400 h-8 w-8" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
        
        <p className="text-purple-200 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Button color="primary" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;