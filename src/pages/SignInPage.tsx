import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, ArrowLeft, Loader, Mail } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email.trim(), password);
      
      // Check if admin and redirect accordingly
      if (email.trim() === 'gangadhar.g0516@gmail.com') {
        navigate('/admin');
        toast.success('Welcome back, Admin!');
      } else {
        // Redirect to the previous page or home
        const from = location.state?.from || '/';
        navigate(from);
        toast.success('Successfully signed in!');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            setError('Invalid email or password');
            toast.error('Invalid email or password');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later');
            toast.error('Too many failed attempts');
            break;
          case 'auth/invalid-email':
            setError('Invalid email format');
            toast.error('Invalid email format');
            break;
          default:
            setError('An error occurred while signing in');
            toast.error('Sign in failed');
        }
      } else {
        setError('An unexpected error occurred');
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSocialLoading('google');
      setError('');
      await signInWithGoogle();
      
      const from = location.state?.from || '/';
      navigate(from);
      toast.success('Successfully signed in with Google!');
    } catch (err) {
      console.error('Google signin error:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/account-exists-with-different-credential':
            setError('An account already exists with this email using a different sign-in method');
            break;
          case 'auth/popup-closed-by-user':
            setError('Sign-in was cancelled');
            break;
          case 'auth/popup-blocked':
            setError('Popup was blocked. Please allow popups and try again');
            break;
          default:
            setError('Failed to sign in with Google. Please try again.');
        }
      } else {
        setError('An unexpected error occurred with Google sign-in.');
      }
      toast.error(error || 'Failed to sign in with Google');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setSocialLoading('facebook');
      setError('');
      await signInWithFacebook();
      
      const from = location.state?.from || '/';
      navigate(from);
      toast.success('Successfully signed in with Facebook!');
    } catch (err) {
      console.error('Facebook signin error:', err);
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/account-exists-with-different-credential':
            setError('An account already exists with this email using a different sign-in method');
            break;
          case 'auth/popup-closed-by-user':
            setError('Sign-in was cancelled');
            break;
          case 'auth/popup-blocked':
            setError('Popup was blocked. Please allow popups and try again');
            break;
          default:
            setError('Failed to sign in with Facebook. Please try again.');
        }
      } else {
        setError('An unexpected error occurred with Facebook sign-in.');
      }
      toast.error(error || 'Failed to sign in with Facebook');
    } finally {
      setSocialLoading(null);
    }
  };

  const isDisabled = isLoading || socialLoading !== null;

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

          {/* Social Sign In Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              color="secondary"
              fullWidth
              onClick={handleGoogleSignIn}
              disabled={isDisabled}
            >
              {socialLoading === 'google' ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Signing in with Google...
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
              onClick={handleFacebookSignIn}
              disabled={isDisabled}
            >
              {socialLoading === 'facebook' ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Signing in with Facebook...
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
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="Enter your email"
              error={error}
              disabled={isDisabled}
            />
            
            <div>
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
                error={error}
                disabled={isDisabled}
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
            
            <div className="pt-4">
              <Button 
                type="submit" 
                color="primary" 
                fullWidth
                disabled={isDisabled}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
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

export default SignInPage;