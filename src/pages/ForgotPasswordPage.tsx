import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send password reset email. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-purple-700 rounded-full mb-4">
              <KeyRound className="text-blue-400 h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Reset Password</h1>
            <p className="text-purple-200 mt-2">
              Enter your email address to receive a password reset link
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="text-green-400 h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-purple-200 mb-6">
                We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
              <Button color="primary" onClick={() => navigate('/signin')}>
                Return to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email address"
                error={error}
                disabled={loading}
              />
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  color="primary" 
                  fullWidth
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Sending Reset Link...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-purple-200 mb-4">
              Remember your password?{' '}
              <Link to="/signin" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-white flex items-center justify-center mx-auto"
              disabled={loading}
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

export default ForgotPasswordPage;