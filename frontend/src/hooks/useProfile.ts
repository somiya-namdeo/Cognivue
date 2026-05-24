import { useState, useEffect } from 'react';
import { getCurrentUserProfile } from '../services/api';
import type { UserProfileDetails } from '../services/api';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfileDetails>(getCurrentUserProfile());

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfile(getCurrentUserProfile());
    };

    window.addEventListener('profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('profile_updated', handleProfileUpdate);
  }, []);

  return profile;
};
