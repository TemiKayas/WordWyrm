'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileContextType {
  profilePictureId: number;
  setProfilePictureId: (id: number) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profilePictureId, setProfilePictureId] = useState(1); // Default to first character

  return (
    <ProfileContext.Provider value={{ profilePictureId, setProfilePictureId }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
