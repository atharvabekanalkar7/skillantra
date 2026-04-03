"use client";

/**
 * Global alternating click sound handler with pre-initialization
 */

let toggle = true;

let audio1: HTMLAudioElement | null = null;
let audio2: HTMLAudioElement | null = null;

function initAudio() {
  if (typeof window === "undefined") return;
  
  if (!audio1) {
    audio1 = new Audio("/ps1.mp3");
    audio2 = new Audio("/ps2.mp3");

    audio1.preload = "auto";
    audio2.preload = "auto";
    
    // Set consistent low volume
    audio1.volume = 0.15;
    audio2.volume = 0.15;
  }
}

export function playClickSound() {
  initAudio();

  const audio = toggle ? audio1 : audio2;

  if (audio) {
    audio.currentTime = 0;

    audio.play().catch((err) => {
      // Browser likely blocked autoplay - will work after first interaction
      console.log("Audio blocked:", err);
    });
  }

  toggle = !toggle;
}

