import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trash2, UserPlus, AlertCircle, Loader } from 'lucide-react';
import { ref, get, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Button from '../components/Button';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.email !== 'gangadhar.g0516@gmail.com') {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const usersData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
            id,
            ...data
          }));
          setUsers(usersData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;

    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-white">
            <Loader className="animate-spin h-5 w-5" />
            <span>Loading users...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="bg-purple-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="text-purple-300 h-6 w-6 mr-2" />
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            <Button color="primary" onClick={() => navigate('/admin/create-user')}>
              <UserPlus className="h-5 w-5 mr-2" />
              Add User
            </Button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <p className="text-purple-200">No users found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map(user => (
                <div
                  key={user.id}
                  className="bg-purple-900/50 rounded-lg p-4 border border-purple-700/50 flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-white font-semibold">{user.name}</h3>
                    <p className="text-purple-300 text-sm">{user.email}</p>
                    <div className="text-purple-400 text-xs space-x-4">
                      <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(user.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    color="danger"
                    size="small"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;