
import { User, UserProfile, ProfileData } from '@/types/auth';
import { useAuthSignIn } from './use-auth-signin';
import { useProfileUpdate } from './use-profile-update';

export function useAuthOperations(
  user: User | null,
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsUpdatingProfile: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Use our modular hooks
  const authSignIn = useAuthSignIn(setUser);
  const profileUpdate = useProfileUpdate(user, setUser, setIsUpdatingProfile);

  // Return all the functions from our modular hooks
  return {
    ...authSignIn,
    ...profileUpdate
  };
}
