"use client";

import { useRef, useEffect } from "react";

export default function useClickSound() {
  const toggleRef = useRef(true);
  const audio1 = useRef<HTMLAudioElement | null>(null);
  const audio2 = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio on client side only to avoid SSR issues
    audio1.current = new Audio("/ps1.mp3");
    audio2.current = new Audio("/ps2.mp3");

    // Optional: Preload the audio to avoid delay on first click
    audio1.current.load();
    audio2.current.load();
    
    // Set a very low volume for premium, subtle feel
    audio1.current.volume = 0.15;
    audio2.current.volume = 0.15;
  }, []);

  const playSound = () => {
    const audio = toggleRef.current ? audio1.current : audio2.current;

    if (audio) {
      // Create a temporary clone or reset to allow rapid firing
      // reset speed for instant playback
      audio.currentTime = 0;
      audio.play().catch((err) => {
        // Silently fail if blocked by browser autoplay policy 
        // (usually allowed after first user interaction)
        console.debug("Audio play blocked or failed:", err);
      });
    }

    toggleRef.current = !toggleRef.current;
  };

  return playSound;
}
