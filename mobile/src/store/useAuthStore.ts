import { create } from 'zustand';
import { onAuth, signOut } from '../services/firebase';
import { Endpoints } from '../services/api';
import { DEV_MODE } from '../config';

interface Profile {
  id: string;
  username: string;
  email: string;
  tier: 'FREE' | 'PREMIUM';
  coinBalance: number;
  avatarUrl?: string;
  bio?: string;
  membership?: any;
}

interface AuthState {
  initializing: boolean;
  firebaseUser: any | null;
  profile: Profile | null;
  setFirebaseUser: (u: any | null) => void;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initializing: true,
  firebaseUser: null,
  profile: null,

  setFirebaseUser: (u) => set({ firebaseUser: u }),

  refreshProfile: async () => {
    try {
      const profile = await Endpoints.me();
      set({ profile });
    } catch {
      // ignore; user may not be provisioned yet
    }
  },

  logout: async () => {
    await signOut();
    set({ firebaseUser: null, profile: null });
  },

  // Wire Firebase auth state → load backend profile.
  init: () => {
    // DEV_MODE: bypass Firebase, treat the dev user as signed in.
    if (DEV_MODE) {
      set({ firebaseUser: { uid: 'dev-uid' }, initializing: false });
      get().refreshProfile();
      return;
    }
    onAuth(async (u) => {
      set({ firebaseUser: u, initializing: false });
      if (u) await get().refreshProfile();
      else set({ profile: null });
    });
  },
}));
