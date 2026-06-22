import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  // 🌟 FIX: Default theme ab strictly 'dark' hai
  theme: localStorage.getItem('mintcv-theme') || 'dark',
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('mintcv-theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return { theme: newTheme };
  }),

  initTheme: () => {
    // 🌟 FIX: Init ke time bhi fallback 'dark' kar diya
    const currentTheme = localStorage.getItem('mintcv-theme') || 'dark';
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}));