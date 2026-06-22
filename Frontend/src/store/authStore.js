import { create } from "zustand";
import axios from "axios";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true, 

  isPaywallOpen: false,
  openPaywall: () => set({ isPaywallOpen: true }),
  closePaywall: () => set({ isPaywallOpen: false }),

  setUser: (userData) => set({ user: userData, isAuthenticated: true }),
  
  logout: () => set({ user: null, isAuthenticated: false }),

  checkAuth: async () => {
    try {
      const response = await axios.get(import.meta.env.VITE_API_URL + "/api/auth/get-me", {
        withCredentials: true,
      });
      set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },
}));