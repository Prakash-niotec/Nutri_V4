import React, { createContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, loginUser, registerUser, logoutUser } from '../services/firebase/authService';
import { getUserProfile } from '../services/firebase/userService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          setActiveProfile(profile);
        } catch (err) {
          console.error("Failed to fetch user profile in AuthContext:", err);
        }
      } else {
        setUserProfile(null);
        setActiveProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return await loginUser(email, password);
  };

  const register = async (email, password, fullName) => {
    return await registerUser(email, password, fullName);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setUserProfile(null);
    setActiveProfile(null);
  };

  const switchProfile = (profile = null) => {
    if (profile) {
      setActiveProfile(profile);
    } else {
      setActiveProfile(userProfile); // Default to main user
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        activeProfile,
        loading,
        isAuthenticated: !!user && !!userProfile?.onboardingCompleted,
        login,
        register,
        logout,
        setUserProfile,
        switchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};