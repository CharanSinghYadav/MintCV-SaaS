import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  // Default theme hum local storage se padhenge, ya fir 'light' set karenge
  theme: localStorage.getItem('mintcv-theme') || 'light',
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('mintcv-theme', newTheme);
    
    // HTML tag par .dark class lagana aur hatana
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return { theme: newTheme };
  }),

  // Jab app pehli baar load ho toh ye function run karna zaroori hai
  initTheme: () => {
    const currentTheme = localStorage.getItem('mintcv-theme') || 'light';
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}));