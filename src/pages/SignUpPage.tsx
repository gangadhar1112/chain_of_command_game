import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Loader, Mail } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !name.trim()) {
      setError('Email and name are required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await signUp(email.trim(), password, name.trim());
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('An account with this email already exists');
            break;
          case 'auth/invalid-email':
            setError('Invalid email address');
            break;
          case 'auth/weak-password':
            setError('Password is too weak - must be at least 6 characters');
            break;
          default:
            setError('Failed to create account. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      toast.error(error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setSocialLoading('google');
      setError('');
      await signInWithGoogle();
      // Navigation and toast will be handled by AuthContext after redirect
    } catch (err) {
      console.error('Google signup error:', err);
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('An unexpected error occurred with Google sign-up.');
        toast.error('An unexpected error occurred with Google sign-up.');
      }
      setSocialLoading(null);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      setSocialLoading('facebook');
      setError('');
      await signInWithFacebook();
      // Navigation and toast will be handled by AuthContext after redirect
    } catch (err) {
      console.error('Facebook signup error:', err);
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError('An unexpected error occurred with Facebook sign-up.');
        toast.error('An unexpected error occurred with Facebook sign-up.');
      }
      setSocialLoading(null);
    }
  };

  const isDisabled = loading || socialLoading !== null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-purple-700 rounded-full mb-4">
              <UserPlus className="text-green-400 h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sign Up</h1>
            <p className="text-purple-200 mt-2">
              Create your Chain of Command account
            </p>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              color="secondary"
              fullWidth
              onClick={handleGoogleSignUp}
              disabled={isDisabled}
            >
              {socialLoading === 'google' ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Signing up with Google...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Continue with Google
                </span>
              )}
            </Button>

            <Button
              color="secondary"
              fullWidth
              onClick={handleFacebookSignUp}
              disabled={isDisabled}
            >
              {socialLoading === 'facebook' ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Signing up with Facebook...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </span>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-purple-800/50 text-purple-300">Or continue with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              disabled={isDisabled}
            />

            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="Enter your email"
              disabled={isDisabled}
            />
            
            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              disabled={isDisabled}
            />
            
            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Confirm your password"
              disabled={isDisabled}
            />
            
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            
            <div className="pt-4">
              <Button 
                type="submit" 
                color="primary" 
                fullWidth
                disabled={isDisabled}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-purple-200 mb-4">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="text-purple-300 hover:text-white flex items-center justify-center mx-auto"
              disabled={isDisabled}
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

export default SignUpPage;