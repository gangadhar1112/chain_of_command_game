import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-purple-700 rounded-full mb-4">
              <LogIn className="text-blue-400 h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sign In</h1>
            <p className="text-purple-200 mt-2">
              Sign in to your Chain of Command account
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            
            <div>
              <Input
                label="Password"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <div className="mt-1 text-right">
                <Link 
                  to="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
            
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            
            <div className="pt-4">
              <Button type="submit" color="primary" fullWidth>
                Sign In
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-purple-200 mb-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300">
                Sign up
              </Link>
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-white flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignInPage;