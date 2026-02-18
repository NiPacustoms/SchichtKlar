import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { AuthService, UserProfile } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async user => {
      setUser(user);

      if (user) {
        const profile = await AuthService.getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string) => AuthService.signIn(email, password);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: 'admin' | 'nurse' = 'nurse'
  ) => {
    await AuthService.signUp(email, password, displayName, role);
  };

  const signOut = () => AuthService.signOut();

  return {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: userProfile?.role === 'admin',
  };
};
