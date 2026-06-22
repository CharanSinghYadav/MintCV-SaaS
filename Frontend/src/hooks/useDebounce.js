import { useState, useEffect } from "react";

// Ye hook kisi bhi value ko lega, aur ek fixed time (delay) ke baad hi usko aage bhejega
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Ek timer set karo
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: Agar delay khatam hone se pehle user ne wapas type kar diya, 
    // toh purana timer cancel kar do aur naya shuru karo.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}