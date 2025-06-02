import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Loader } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleImageSelect = (file: File) => {
    setProfileImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Form validation
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
      let photoURL = null;

      // Handle profile image upload if one was selected
      if (profileImage) {
        const storage = getStorage();
        const imageRef = storageRef(storage, `profile_images/${Date.now()}_${profileImage.name}`);
        
        try {
          const uploadResult = await uploadBytes(imageRef, profileImage);
          photoURL = await getDownloadURL(uploadResult.ref);
        } catch (uploadError) {
          console.error('Error uploading profile image:', uploadError);
          toast.error('Failed to upload profile image');
          return;
        }
      }

      // Create the account
      await signUp(email.trim(), password, name.trim(), photoURL);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      setLoading(false);
      
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-6">
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={null}
              />
            </div>

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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
            
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            
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

export default SignUpPage;